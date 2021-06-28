import React, { useState } from 'react'
import Web3 from "web3";
import ClipLoader from "react-spinners/ClipLoader";
import LoadingOverlay from 'react-loading-overlay';

import Vault from './Vault'
import { wyanCoinAddress, wyanCoinAbi, wyanVaultAddress, wyanVaultAbi } from './contracts'

function App() {

    const [connected, setConnected] = useState(false)
    const [wallet, setWallet] = useState(null)
    const [tokenContract, setTokenContract] = useState(null)
    const [vaultContract, setVaultContract] = useState(null)
    const [web3, setWeb3] = useState(null)

    const [loading, setLoading] = useState(false)
    const [overlayText, setOverlayText] = useState('Transacting...')


    const connectWallet = async () => {
        if (window.ethereum) {
            const web3 = new Web3(window.ethereum)
            setWeb3(web3)

            await window.ethereum.enable()
            let account = await web3.eth.getAccounts()
            setWallet(account[0])

            const wyanCoinInstance = new web3.eth.Contract(wyanCoinAbi, wyanCoinAddress);
            setTokenContract(wyanCoinInstance);

            const wyanVaultInstance = new web3.eth.Contract(wyanVaultAbi, wyanVaultAddress);
            setVaultContract(wyanVaultInstance);
        }
    }

    const setOverlay = (active, text) => {
        setLoading(active)
        setOverlayText(text)
    }

    return (
    <LoadingOverlay
        active={loading}
        spinner
        text={overlayText}
        fadeSpeed={2000}
    >
        <div className="bg-gray-600 h-screen w-screen">

            <div className="bg-gray-600 h-screen w-screen">
                <div className="flex bg-white h-16 p-4 items-center sticky top-0 z-10">
                    <p className='flex-none rounded-2xl text-xl sm:text-2xl'> WyanCoin </p>
                    <div className='flex-grow w-full'></div>
                    {wallet == null &&
                        <button
                            className='p-2 flex-none rounded-3xl bg-red-300 text-white text-lg border-8 border-white'
                            onClick={connectWallet}
                        > Connect Wallet </button>
                    }
                    {wallet != null && <div className='ml-4 px-4 truncate rounded-3xl bg-red-300 text-white text-lg w-96 md:w-1/6'>{wallet}</div>}

                </div>
                { !loading &&
                    <div className="flex flex-row flex-wrap bg-gray-600 justify-evenly py-10">
                        <Vault
                            symbol='WYN'
                            tokenContract={tokenContract}
                            vaultContract={vaultContract}
                            wallet={wallet} web3={web3}
                            disabled={false}
                            overlayCallback={setOverlay}
                        />
                        <Vault
                            symbol='ETH'
                            tokenContract={tokenContract}
                            vaultContract={vaultContract}
                            wallet={wallet} web3={web3}
                            disabled={true}
                            overlayCallback={setOverlay}
                        />
                    </div>
                }
            </div>

        </div>
    </LoadingOverlay>

    );
}

export default App;
