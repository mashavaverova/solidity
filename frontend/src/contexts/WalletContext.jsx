import { createContext, useState, useEffect } from 'react';
import Web3 from 'web3';

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [web3, setWeb3] = useState(null);

  // Function to connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('MetaMask not detected. Please install MetaMask.');
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress(null);
    setWeb3(null);
    alert('Disconnected');
  };

  // Automatically update wallet address when accounts change
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setWalletAddress(accounts[0] || null);
      });
    }
  }, []);

  return (
    <WalletContext.Provider value={{ walletAddress, web3, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
