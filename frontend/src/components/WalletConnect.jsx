import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';
import '../CSS/WalletConnect.CSS'

const WalletConnect = () => {
  const { walletAddress, connectWallet, disconnectWallet } = useContext(WalletContext);

  return (
    <div>
      {!walletAddress ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {walletAddress}</p>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;