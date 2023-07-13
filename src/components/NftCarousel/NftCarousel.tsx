import React, { useState, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Box,Text,Image } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { config } from 'dotenv';

config();

const apiKey = process.env.NEXT_PUBLIC_COVALENT_API_KEY;
const eth_mainnet_api_key = process.env.NEXT_PUBLIC_ETH_MAINNET_API_KEY;

const NftCarousel = ({ address } : any) => {


    const headers = {
        'Authorization': `Bearer ${apiKey}`,
    };
    
    const [nftBalances, setNftBalances] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(true);

    const chains = ['eth-mainnet', 'matic-mainnet', 'matic-mumbai'];

    const isEnsName = (name: string) => {
        return name.includes('.eth');
    };

    useEffect(() => {
        const fetchData = async () => {
            if (address) {
                const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${eth_mainnet_api_key}`); 
                let resolvedAddress = address;
                if (isEnsName(address)) {
                    try {
                        resolvedAddress = await provider.resolveName(address);
                        console.log('Resolved ENS name:', resolvedAddress);
                    } catch (error) {
                        console.error('Could not resolve ENS name:', error);
                        return; 
                    }
                }

                try {
                    const promises = chains.map((chainName) => getNftBalances(chainName, resolvedAddress));
                    const results = await Promise.all(promises);
                    const balances : any = {};
                    results.forEach((data, index) => {
                        balances[chains[index]] = data;
                    });
                    setNftBalances(balances);
                    setLoading(false);
                } catch (error) {
                    console.error('Error fetching NFT balances:', error);
                }
            }
        };
        fetchData();
    }, [address]);

    const getNftBalances = async (chainName : string, address : string) => {
        try {
            const url = `https://api.covalenthq.com/v1/${chainName}/address/${address}/balances_nft/`;
            const res = await fetch(url, { method: 'GET', headers });
            const data = await res.json();
            return data;
        } catch (error) {
            console.error(`Error fetching NFT balances for chain '${chainName}':`, error);
            return null;
        }
    };

    const getOpenseaUrl = (chainName : string, contractAddress : string, tokenId : string) => {
        let openseaChainName = '';
        if (chainName === 'eth-mainnet' || chainName === 'matic-mainnet') {
            if (chainName === 'eth-mainnet') {
                openseaChainName = 'ethereum';
            } else if (chainName === 'matic-mainnet') {
                openseaChainName = 'matic';
            }
            return `https://opensea.io/assets/${openseaChainName}/${contractAddress}/${tokenId}`;
        } else {
            openseaChainName = 'mumbai';
            return `https://testnets.opensea.io/assets/${openseaChainName}/${contractAddress}/${tokenId}`;
        }
    };

    return (
        <Box maxHeight="60vh" maxWidth="40vw" overflowY="auto">
            <Carousel showThumbs={false} dynamicHeight={false}>
                {Object.keys(nftBalances).flatMap((chainName) =>
                    nftBalances[chainName]?.data?.items.map((nft : any, index : number) => (
                        <Box key={index} mb={"5%"} borderRadius="md">
                            <a href={getOpenseaUrl(chainName, nft.contract_address, nft?.nft_data[0].token_id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                <Image
                                    src={nft?.nft_data[0].external_data?.image || "https://via.placeholder.com/150"}
                                    alt={nft?.contract_name || "NFT image"}
                                    objectFit="contain" 
                                    height={"20rem"}
                                    borderRadius="xl" 
                                    mb={4}
                                />
                            </a>
                            <Text fontSize="xl" mb={1} color="F8F8FF">{nft.contract_name}</Text>
                            <Text fontSize="sm" color="F8F8FF">{chainName}</Text>
                        </Box>
                    ))
                )}
            </Carousel>
        </Box>
    );

};

export default NftCarousel;
