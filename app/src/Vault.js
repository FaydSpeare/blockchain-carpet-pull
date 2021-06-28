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
                interest = parseFloat(web3.utils.fromWei(interest) * 100 * YEARLY_MULTIPLIER)
                setApr(interest)

                let stakeRewards = await vaultContract.methods.getRewards(wyanCoinAddress, wallet).call()
                stakeRewards = parseFloat(web3.utils.fromWei(stakeRewards))
                setRewards(stakeRewards)
            }


        }
    }, [tokenContract, vaultContract])

    useEffect(() => {
        if (vaultContract != null && symbol !== 'ETH') {
            const id = setInterval(async () => {

                let walletBalance = await getBalance(symbol)
                walletBalance = parseFloat(web3.utils.fromWei(walletBalance))
                setBalance(parseFloat(walletBalance))

                let stakeRewards = await vaultContract.methods.getRewards(wyanCoinAddress, wallet).call()
                stakeRewards = parseFloat(web3.utils.fromWei(stakeRewards))
                setRewards(stakeRewards)

                let totalLockedValue = await vaultContract.methods.getTotalStaked(wyanCoinAddress).call()
                totalLockedValue = parseFloat(web3.utils.fromWei(totalLockedValue))
                setTvl(totalLockedValue)

                let interest = await vaultContract.methods.getBlockRewards(wyanCoinAddress).call()
                interest = parseFloat(web3.utils.fromWei(interest) * 100 * YEARLY_MULTIPLIER)
                setApr(interest)

                let stakedAmount = await vaultContract.methods.getDeposit(wyanCoinAddress, wallet).call()
                stakedAmount = parseFloat(web3.utils.fromWei(stakedAmount))
                setStaked(stakedAmount)

            }, 10000)
            return () => clearInterval(id)
        }
    }, [vaultContract])

    const getBalance = async (symbol) => {
        return symbol === 'ETH' ? await web3.eth.getBalance(wallet) : await tokenContract.methods.balanceOf(wallet).call()
    }


    const deposit = (value) => {

        if (value <= 0) {
            alert('Deposit amount must be larger than 0')
            return
        }

        if (value > balance) {
            alert('Deposit amount cannot be larger than your available balance')
            return
        }

        overlayCallback(true, 'Transacting Approval...')
        tokenContract.methods.increaseAllowance(wyanVaultAddress, web3.utils.toWei(value,'ether'))
            .send({from: wallet}, function (err, res) {

                if (err) {
                    console.log("Approval Error", err)
                    overlayCallback(false, 'Approval Error')
                    return
                }

                overlayCallback(true, 'Transacting Deposit...')

                vaultContract.methods.deposit(wyanCoinAddress, web3.utils.toWei(value,'ether')).send({from: wallet}, function (err, res) {
                    if (err) {
                        console.log("Deposit Error", err)
                        overlayCallback(false, 'Deposit Error')
                    }
                }).then((receipt) => {
                    overlayCallback(false, 'Deposit Successful')
                })
            })
    }


    const withdraw = () => {
        if (staked <= 0) {
            alert('Withdrawal amount must be positive.')
            return
        }
        overlayCallback(true, 'Transacting Withdrawal...')
        vaultContract.methods.withdraw(wyanCoinAddress).send({from: wallet}, function (err, res) {
            if (err) {
                console.log("Withdrawal Error", err)
                overlayCallback(false, 'Withdrawal Error')
            }
        }).then((receipt) => {
            overlayCallback(false, 'Withdrawal Successful')
        })
    }

    const filterNumericInput = (text, callback) => {
        if (!isNaN(text)) {
            callback(text)
        }
    }



    return (
        <div disabled={true} className='flex flex-col items-center m-5 bg-blue-200 rounded-3xl gap-y-5 w-10/12 sm:w-96 py-10 shadow-2xl disabled:bg-black'>

            <div className='flex flex-col justify-center items-center flex-grow bg-white rounded-2xl gap-y-2 w-5/6 p-3'>
                <b className='text-2xl'>{symbol} Vault</b>
                <div className='grid grid-cols-2 divide-x-2 divide-purple-400 w-full'>
                    <div className='flex flex-col text-center divide-x'>
                        <p className='text-purple-400 text-md'>APR:</p>
                        <p>{apr.toFixed(2)}%</p>
                    </div>
                    <div className='flex flex-col text-center'>
                        <p className='text-purple-400 text-md'>TVL:</p>
                        <p>{tvl.toFixed(1)} {symbol}</p>
                    </div>
                </div>
            </div>

            <div className='flex flex-col items-center flex-grow bg-white rounded-2xl gap-y-3 w-5/6 py-3'>
                <div className='px-5 truncate max-w-full text-gray-400'>Available: {balance.toFixed(3)} {symbol}</div>
                <input
                    disabled={disabled || staked > 0}
                    className='w-5/6 pl-3 border-2 rounded-2xl outline-none border-black'
                    type='text' inputMode='numeric' placeholder='0'
                    onChange={(e => filterNumericInput(e.target.value, setDepositValue))}
                    value={depositValue}
                >
                </input>
                <div className='bg-purple-300 w-10/12 py-1 rounded-2xl text-center' onClick={() => deposit(depositValue)}>Deposit</div>
            </div>

            <div className='flex flex-col items-center flex-grow bg-white rounded-2xl gap-y-3 w-5/6 py-3'>
                <div className='px-5 truncate max-w-full text-gray-400'>Available: {staked.toFixed(3)} {symbol}</div>
                <div className='bg-purple-300 w-10/12 py-1 rounded-2xl text-center' onClick={withdraw}>Withdraw & Harvest</div>
            </div>

            <div className='flex-grow bg-gradient-to-r from-purple-300 to-red-300 rounded-full w-5/6'>
                <div className='flex flex-col justify-center items-center bg-white m-1 rounded-full gap-y-2'>
                    <div className='px-5 py-2 truncate max-w-full'>Rewards: {rewards.toFixed(3)}</div>
                </div>
            </div>

        </div>

    )
}

// <input
//     className='w-5/6 pl-3 border-2 rounded-2xl border-black outline-none'
//     type='text' inputMode='numeric' placeholder='0' disabled={disabled}
//     onChange={(e => filterNumericInput(e.target.value, setWithdrawValue))}
//     value={withdrawValue}
// >
// </input>
