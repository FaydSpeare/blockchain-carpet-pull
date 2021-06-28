import React, { useState, useEffect } from 'react'

import { wyanCoinAddress, wyanVaultAddress } from './contracts'

const YEARLY_MULTIPLIER = (60 * 60 * 24 * 365) / 30;

export default function Vault({ symbol, tokenContract, vaultContract, wallet, web3, disabled, overlayCallback }) {

    const [balance, setBalance] = useState(0.0)
    const [staked, setStaked] = useState(0.0)
    const [rewards, setRewards] = useState(0.0)
    const [apr, setApr] = useState(0.0)
    const [tvl, setTvl] = useState(0.0)
    const [depositValue, setDepositValue] = useState('')
    const [withdrawValue, setWithdrawValue] = useState('')

    useEffect( async () => {
        if (tokenContract != null && vaultContract != null) {
            let walletBalance = await getBalance(symbol)
            walletBalance = parseFloat(web3.utils.fromWei(walletBalance))
            setBalance(parseFloat(walletBalance))

            if (symbol !== 'ETH') {
                let stakedAmount = await vaultContract.methods.getDeposit(wyanCoinAddress, wallet).call()
                stakedAmount = parseFloat(web3.utils.fromWei(stakedAmount))
                setStaked(stakedAmount)

                let totalLockedValue = await vaultContract.methods.getTotalStaked(wyanCoinAddress).call()
                totalLockedValue = parseFloat(web3.utils.fromWei(totalLockedValue))
                setTvl(totalLockedValue)

                let interest = await vaultContract.methods.getBlockRewards(wyanCoinAddress).call()
                interest = parseFloat(interest * 100 * YEARLY_MULTIPLIER)
                setApr(interest)
            }


        }
    }, [tokenContract, vaultContract])

    useEffect(() => {
        if (vaultContract != null) {
            // const id = setInterval(async () => {
            //     let stakeRewards = await vaultContract.methods.getRewards(wyanCoinAddress, wallet).call()
            //         .then((result) => {
            //             stakeRewards = parseFloat(web3.utils.fromWei(stakeRewards))
            //             setRewards(stakeRewards)
            //         })
            //         .catch((err) => {
            //             //console.log(err)
            //         })
            //
            // }, 10000)
            // return () => clearInterval(id)
        }
    }, [vaultContract])

    const getBalance = async (symbol) => {
        return symbol === 'ETH' ? await web3.eth.getBalance(wallet) : await tokenContract.methods.balanceOf(wallet).call()
    }


    const deposit = (value) => {

        overlayCallback(true, 'Transacting Approval...')
        tokenContract.methods.increaseAllowance(wyanVaultAddress, web3.utils.toWei(value,'ether')).send({from: wallet})
            .on('confirmation', (num, receipt) => {
                console.log(num, receipt)
                overlayCallback(true, 'Transacting Deposit...')

                vaultContract.methods.deposit(wyanCoinAddress, web3.utils.toWei(value,'ether')).send({from: wallet})
                    .on('confirmation', (num, receipt) => {
                        console.log(num, receipt)
                        overlayCallback(false, 'Deposit Successful')
                    })
                    .on('error', (error, receipt) => {
                        console.log(error, receipt)
                        overlayCallback(false, 'Deposit Error')
                    })

            })
            .on('error', (error, receipt) => {
                console.log(error, receipt)
                overlayCallback(false, 'Approval Error')
            })
    }

    const withdraw = () => {
        overlayCallback(true, 'Transacting Withdrawal...')
        vaultContract.methods.withdraw(wyanCoinAddress).send({from: wallet})
            .on('confirmation', (num, receipt) => {
                console.log(num, receipt)
                overlayCallback(false, 'Withdrawal Successful')
            })
            .on('error', (error, receipt) => {
                console.log(error, receipt)
                overlayCallback(false, 'Withdrawal Error')
            })
    }

    const filterNumericInput = (text, callback) => {
        if (!isNaN(text)) {
            callback(text)
        }
    }



    return (
        <div className='flex flex-col items-center m-5 bg-blue-200 rounded-3xl gap-y-5 w-10/12 sm:w-96 py-10 shadow-2xl'>

            <div className='flex flex-col justify-center items-center flex-grow bg-white rounded-2xl gap-y-2 w-5/6 p-3'>
                <b className='text-2xl'>{symbol} Vault</b>
                <div className='grid grid-cols-2 divide-x-2 divide-purple-400 w-full'>
                    <div className='flex flex-col text-center divide-x'>
                        <p className='text-purple-400 text-md'>APR:</p>
                        <p>{apr.toFixed(2)}%</p>
                    </div>
                    <div className='flex flex-col text-center'>
                        <p className='text-purple-400 text-md'>TVL:</p>
                        <p>{tvl} {symbol}</p>
                    </div>
                </div>
            </div>

            <div className='flex flex-col items-center flex-grow bg-white rounded-2xl gap-y-3 w-5/6 py-3'>
                <div className='px-5 truncate max-w-full text-gray-400'>Available: {balance.toFixed(5)} {symbol}</div>
                <input
                    className='w-5/6 pl-3 border-2 rounded-2xl border-black outline-none'
                    type='text' inputMode='numeric' placeholder='0' disabled={disabled}
                    onChange={(e => filterNumericInput(e.target.value, setDepositValue))}
                    value={depositValue}
                >
                </input>
                <div className='bg-purple-300 w-10/12 py-1 rounded-2xl text-center' onClick={() => deposit(depositValue)}>Deposit</div>
            </div>

            <div className='flex flex-col items-center flex-grow bg-white rounded-2xl gap-y-3 w-5/6 py-3'>
                <div className='px-5 truncate max-w-full text-gray-400'>Available: {staked.toFixed(5)} {symbol}</div>
                    <input
                        className='w-5/6 pl-3 border-2 rounded-2xl border-black outline-none'
                        type='text' inputMode='numeric' placeholder='0' disabled={disabled}
                        onChange={(e => filterNumericInput(e.target.value, setWithdrawValue))}
                        value={withdrawValue}
                    >
                    </input>
                    <div className='bg-purple-300 w-10/12 py-1 rounded-2xl text-center' onClick={() => withdraw(withdrawValue)}>Withdraw & Harvest</div>
            </div>

            <div className='flex-grow bg-gradient-to-r from-purple-300 to-red-300 rounded-full w-5/6'>
                <div className='flex flex-col justify-center items-center bg-white m-1 rounded-full gap-y-2'>
                    <div className='px-5 py-2 truncate max-w-full'>Rewards: {rewards.toFixed(5)}</div>
                </div>
            </div>

        </div>

    )
}
