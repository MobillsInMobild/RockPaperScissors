import React, { useEffect, useState } from 'react';
import { ethers, AbiCoder } from 'ethers';
import contractABI from './contractABI.json';
import './GamesList.css';
import './Game.css';
import './Fund.css';

const contractAddress = '0x03A7F9171A30787D64188a46E708031778E3E8fE';
const abi_coder = new AbiCoder();
// const bscTestnetProviderUrl = "https://bsc-prebsc-dataseed.bnbchain.org/";
// const provider = new ethers.JsonRpcProvider(bscTestnetProviderUrl);
var provider;
var contract;
var signer;

function ConnectWallet({ onGameListChange }) {
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
        onGameListChange();
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



function GamesList({ gameListChanged, resetGameListChanged }) {
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
    if (gameListChanged) {
      Promise.all([
        fetchGames('new'),
        fetchGames('pending'),
        fetchGames('finished')
      ]).then(([newGamesList, pendingGamesList, finishedGamesList]) => {
        setNewGames(newGamesList);
        setPendingGames(pendingGamesList);
        setFinishedGames(finishedGamesList);
      }).finally(() => {
        resetGameListChanged();
      });
    };
  }, [gameListChanged]);

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
    <div className='balance-container'>
      <input
        className="input-amount"
        type="text"
        value={payableAmount}
        onChange={(e) => setPayableAmount(e.target.value)}
        placeholder="Amount"
      />
      <button className="button button-deposit" onClick={handleDeposit}>Deposit</button>
      <button className="button button-withdraw" onClick={handleWithdraw}>Withdraw</button>
      <button className="button button-get-balance" onClick={handleGetBalance}>Get Balance</button>
      <span className="balance-display">Balance: {balance}</span>
    </div>
  );
};

function Game({ onGameListChange }) {
  const [GameId, setGameId] = useState(null);
  const [result, setResult] = useState('null');
  const [bet, setBet] = useState(null);
  const [secret, setSecret] = useState('');
  const [input, setInput] = useState('');

  const handleResult = async () => {
    try {
      var game_state = await contract.games(GameId);
      game_state = game_state.result;
      game_state = parseInt(game_state);
      console.log('Game state:', game_state);
      if (game_state === 0) {
        setResult('Pending');
      } else if (game_state === 1) {
        setResult('Win');
      } else if (game_state === 2) {
        setResult('Lose');
      } else if (game_state === 3) {
        setResult('Draw');
      }
    } catch (error) {
      console.error('Failed to get game state:', error);
    }
  };

  useEffect(() => {
    if (GameId !== null) {
      handleResult();
    }
  }, [GameId]);

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
      console.log('Game created: ' + game_id);
      onGameListChange();
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async () => {
    try {
      setGameId(input);
      if (bet !== null) {
        const transaction = await contract.joinGame(input, bet);
        const tx_receipt = await transaction.wait();
        console.log(tx_receipt);
        console.log('Game joined');
        onGameListChange();
      }

    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  const handleReveal = async () => {
    try {
      const bytes32_secret = abi_coder.encode(['string'], [secret]);
      const transaction = await contract.reveal(bet, bytes32_secret, GameId);
      const tx_receipt = await transaction.wait();
      console.log(tx_receipt);
      console.log('Reveal');
      onGameListChange();
    } catch (error) {
      console.error('Failed to reveal:', error);
    }
  };

  const handleFinishGame = async () => {
    try {
      const transaction = await contract.finishGame(GameId);
      const tx_receipt = await transaction.wait();
      console.log(tx_receipt);
      console.log('Game finished');
      onGameListChange();
      handleResult();
    } catch (error) {
      console.error('Failed to finish game:', error);
    };
  };

  return (
    <div className='container'>
      <h2> Game ID : {GameId}</h2>
      <div className="break-line"></div>
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
      <div className="break-line"></div>
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
      <div className="break-line"></div>
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
      <button onClick={handleReveal}>Reveal</button>
      <div className="break-line"></div>
      <button onClick={handleFinishGame}>Finish Game</button>
      <h3>Game Result: {result}</h3>
      <div className="break-line"></div>
    </div>
  );
};



export { ConnectWallet, GamesList, Fund, Game };