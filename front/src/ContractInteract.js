import React, { useEffect, useState } from 'react';
import { ethers, AbiCoder } from 'ethers';
import contractABI from './contractABI.json'; // 假设你的ABI文件名为contractABI.json
import './GamesList.css'; // 引入CSS文件

const contractAddress = '0x03A7F9171A30787D64188a46E708031778E3E8fE';
const abi_coder = new AbiCoder();
// const bscTestnetProviderUrl = "https://bsc-prebsc-dataseed.bnbchain.org/";
// const provider = new ethers.JsonRpcProvider(bscTestnetProviderUrl);
var provider;
var contract;
var signer;

function ConnectWallet({ onWalletConnect }) {
  const [userAddress, setUserAddress] = useState('');

  const connectWalletHandler = async () => {
    if (window.ethereum) {
      try {
        // 使用BSC测试网的Provider
        provider = new ethers.BrowserProvider(window.ethereum)
        try {
          window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x61' }] });
        } catch (error) {
          console.error('Error switching chain:', error);
        }
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        signer = await provider.getSigner(0);
        onWalletConnect();
        setUserAddress(await signer.getAddress());
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.log('Please install MetaMask or another Ethereum wallet.');
    }
  };

  return (
    <div>
      <button onClick={connectWalletHandler}>
        {userAddress ? `Connected as: ${userAddress}` : "Connect Wallet"}
      </button>
    </div>
  );
};



function GamesList({ walletConnected }) {
  contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
  const [newGames, setNewGames] = useState([]);
  const [pendingGames, setPendingGames] = useState([]);
  const [finishedGames, setFinishedGames] = useState([]);

  async function fetchGames(gameType) {
    let games = [];
    try {
      let index = 0;
      while (true) {
        var game;
        if (gameType === 'new') {
          game = await contract.new_games(index);
        } else if (gameType === 'pending') {
          game = await contract.pending_games(index);
        } else if (gameType === 'finished') {
          game = await contract.finished_games(index);
        }
        if (!game || game.length === 0) break;
        games.push(game);
        index++;
      }
    } catch (error) {
      console.log(`${gameType} games fetched: `, games.length);
    };
    return games;
  };

  useEffect(() => {
    if (walletConnected) {
      Promise.all([
        fetchGames('new'),
        fetchGames('pending'),
        fetchGames('finished')
      ]).then(([newGamesList, pendingGamesList, finishedGamesList]) => {
        setNewGames(newGamesList);
        setPendingGames(pendingGamesList);
        setFinishedGames(finishedGamesList);
      });
    };
  }, [walletConnected]);

  return (
    <div className="games-list">
      <div className="column new-games">
        <h2>New Game</h2>
        {newGames.map((game, index) => (
          <p key={index}>{game.toString()}</p>
        ))}
      </div>
      <div className="column pending-games">
        <h2>Pending Game</h2>
        {pendingGames.map((game, index) => (
          <p key={index}>{game.toString()}</p>
        ))}
      </div>
      <div className="column finished-games">
        <h2>Finished Game</h2>
        {finishedGames.map((game, index) => (
          <p key={index}>{game.toString()}</p>
        ))}
      </div>
    </div>
  );
};
const Fund = () => {
  const [payableAmount, setPayableAmount] = useState('');
  const [balance, setBalance] = useState('');

  const handleDeposit = async () => {
    // 假设 contract 是已经初始化的合约实例
    // 请替换为实际的合约方法调用
    try {
      const transaction = await contract.deposit({ value: payableAmount });
      await transaction.wait();
      console.log('Deposit successful');
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    // 假设 contract 是已经初始化的合约实例
    // 请替换为实际的合约方法调用
    try {
      const transaction = await contract.withdraw(payableAmount);
      await transaction.wait();
      console.log('Withdraw successful');
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const handleGetBalance = async () => {
    try {
      const currentBalance = await contract.getBalance();
      setBalance(currentBalance.toString());
      console.log(`Balance: ${currentBalance}`);
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={payableAmount}
        onChange={(e) => setPayableAmount(e.target.value)}
        placeholder="Amount"
      />
      <button onClick={handleDeposit}>Deposit</button>
      <button onClick={handleWithdraw}>Withdraw</button>
      <button onClick={handleGetBalance}>Get Balance</button>
      <span>Balance: {balance}</span>
    </div>
  );
};

function Game(){
  const [GameId, setGameId] = useState(null);
  // const [GameState, setGameState] = useState('waiting');
  const [bet, setBet] = useState(null);
  const [secret, setSecret] = useState('');
  const [input, setInput] = useState('');
  
  const handleCreateGame = async () => {
    try {      
      const bytes32_secret = abi_coder.encode(['string'], [secret]);
      const commit = contract.calculateCommit(bet, bytes32_secret);
      console.log(commit);
      const transaction = await contract.createGame(commit);
      const tx_receipt = await transaction.wait();
      console.log(tx_receipt);
      const log_data = tx_receipt.logs[0].data;
      var game_id = abi_coder.decode(['uint256', 'address'], log_data)[0];
      game_id = parseInt(game_id);
      setGameId(game_id);        
      console.log('Game created');
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async () => {
    try {
      setGameId(10);
      console.log(input, GameId, bet);
      if (bet !== null) {
        const transaction = await contract.joinGame(GameId, bet);
        const tx_receipt = await transaction.wait();
        console.log(tx_receipt);
        console.log('Game joined');
      }
      
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };


  return (
    <div>
      <h2> Game ID : {GameId}</h2>
      <select onChange={(e) => setBet(parseInt(e.target.value))}>
        <option value={null}>--Please choose an option--</option>
        <option value={1}>Rock</option>
        <option value={2}>Paper</option>
        <option value={3}>Scissors</option>
      </select>
      <input
        type="text"
        onChange={(e) => setSecret(e.target.value)}
        placeholder="Secret"
      />
      <button onClick={handleCreateGame}>Create Game</button>
      <br />
      <select onChange={(e) => setBet(parseInt(e.target.value))}>
        <option value={null}>--No Bet And just Join--</option>
        <option value={1}>Rock</option>
        <option value={2}>Paper</option>
        <option value={3}>Scissors</option>
      </select>

      <input
        type="text"
        onChange={(e) => setInput(parseInt(e.target.value))}
        placeholder="Game Id"
      />
      <button onClick={handleJoinGame}>Join Game</button>
    </div>
  );
};



export { ConnectWallet, GamesList, Fund, Game};