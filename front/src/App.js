import { useState } from 'react';
import { ConnectWallet, GamesList, Fund, Game } from './ContractInteract';
import './App.css';

function App() {

  const [gameListChange, setGameListChanged] = useState(false);
  const handleGameListChanged = () => {
    setGameListChanged(true);
  };

  const resetGameListChanged = () => {
    setGameListChanged(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="ConnectWallet">
          <ConnectWallet onGameListChange={handleGameListChanged} />
        </div>
        <GamesList gameListChanged={gameListChange} resetGameListChanged={resetGameListChanged} />
        <div className="Fund">
          <Fund />
        </div>
        <div className="Game">
          <Game onGameListChange={handleGameListChanged} />
        </div>
      </header>
    </div>
  );
}

export default App;