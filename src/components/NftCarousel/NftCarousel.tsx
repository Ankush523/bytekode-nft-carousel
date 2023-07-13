import React, { useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Box,Text,Image } from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useQueries } from 'react-query';
import { config } from 'dotenv';
config();

const eth_mainnet_api_key = process.env.NEXT_PUBLIC_ETH_MAINNET_API_KEY;

const NftCarousel = ({ address } : any) => {

    const chains = ['eth-mainnet', 'matic-mainnet', 'matic-mumbai'];

    const isEnsName = (name: string) => {
        return name.includes('.eth');
    };

    const getNftBalances = async (chainName : string, address : string) => {
        let url = `http://localhost:8080/api/fetch/nftBalance?chainName=${chainName}&address=${address}`
        const res = await fetch(url, { method: 'GET' })
        const data = await res.json()
        return data;
    };

    let resolvedAddress = address;

    useEffect(() => {
        if (isEnsName(address)) {
            const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${eth_mainnet_api_key}`); 
            provider.resolveName(address).then((resolvedAddress) => {
                console.log('Resolved ENS name:', resolvedAddress);
            }).catch((error) => {
                console.error('Could not resolve ENS name:', error);
            });
        }
    }, [address]);

    const results = useQueries(
        chains.map((chainName) => {
            return {
                queryKey: ['nftBalances', chainName, resolvedAddress],
                queryFn: () => getNftBalances(chainName, resolvedAddress),
            }
        })
    );

    const nftBalances: Record<string, any> = {};
    results.forEach((result, index) => {
        if (result.status === 'success') {
            nftBalances[chains[index]] = result.data;
        }
    });

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
