import {useState} from 'react';
import {ConnectWallet, GamesList, Fund, Game} from './ContractInteract';

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const handleWalletConnect = () => {
    setWalletConnected(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <ConnectWallet onWalletConnect = {handleWalletConnect}/>
        <GamesList walletConnected={walletConnected}/>
        <Fund />
        <Game />
      </header>
    </div>
  );
}

export default App;