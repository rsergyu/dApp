import Head from "next/head";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";
import {FaArrowRight, FaCheck, FaWallet} from 'react-icons/fa';
import {Watch} from 'react-loader-spinner'
export default function Home() {

  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // moodSent keep trak of whether the user has sent or not mood
  const [moodSent, setMoodSent] = useState(false);
  // moodText keep trak of mood messages
  const [moodText, setMoodText] = useState();
  const [animation, setAnimaton] = useState('rocket');

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
      getMood();
      } catch (err) {
      console.error(err);
    }
  };

  const renderButtonSet = () => {
    if (walletConnected) {
      if (moodSent) {
        return (
          <div>            
          <button><FaCheck/></button>
          </div>
        );
      } else if (loading) {
        return <button ><Watch color="#7881a1" height="2.2rem" ariaLabel="loading-indicator" /></button>;
      } else {
        return (
          <button onClick={setMood}>
            <FaArrowRight/>
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet}>
          <FaWallet/>
        </button>
      );
    }
  };

  const setAgain = () => {
    setMoodSent(false);
    document.getElementById("mood").value = "";
  };

  const renderButtonRead = () => {
    if (walletConnected) {
      if (moodSent) {
        return (
          <div>       
          <button className="wallconnect" onClick={setAgain} >Send other</button>
          </div>
        );
      } else if (loading) {
        return <button ><Watch color="#7881a1" height="2.2rem" ariaLabel="loading-indicator" /></button>;
      } else {
        return (
          <button className="wallconnect" onClick={getMood} >
            Read Dreams
          </button>
        );
      }
    } else {
      return (
        <button className="wallicon" onClick={connectWallet}>
          <FaWallet/> Connect wallet
        </button>
      );
    }
  };

  const getMood = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const MoodContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // call the numAddressesWhitelisted from the contract
      const mood = await MoodContract.getMood();
      setMoodText(mood);
    } catch (err) {
      console.error(err);
    }
  };

  const setMood = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const MoodContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the addAddressToWhitelist from the contract
      let mood = document.getElementById("mood").value;
      if (!mood) {
        alert("Please type your dream");
        return false;
      }
      const tx = await MoodContract.setMood(mood);
      setLoading(true);
      setAnimaton('rocket Shake');
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      setAnimaton('rocket Takeoff');
      // get the updated number of addresses in the whitelist
      await getMood();
      setMoodSent(true);
      
    } catch (err) {
      console.error(err);
    }
  };

   // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);


  return (
    <>
    <div>
      <Head>
        <title>Dream Rocket-dApp</title>
        <meta name="description" content="Dream Rocket-dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      
      <div id="clouds">
	      <div className="cloud x1"></div>	      
	      <div className="cloud x2"></div>
      	<div className="cloud x3"></div>
      	<div className="cloud x4"></div>
      	<div className="cloud x5"></div>
        <div className="steam">  </div> 
        <div className={animation}>  </div>
        <div className="textWrapper">
                {renderButtonRead()}
          <div className="titleText">Skyrocket your dream!</div>
          <div>Your dream &quot;{moodText}&quot; is going to the moon.</div>

          <div className="containeri">
            <div className="webflow-style-input">
              <input id="mood" type="text" placeholder="What's your dream?" />
              <label htmlFor="text"></label>                
                {renderButtonSet()}
            </div>  
          </div>

        </div>
        <div className="bottomWrapper"></div>
        
      </div>
        
    </div>
    </>
  )
}
