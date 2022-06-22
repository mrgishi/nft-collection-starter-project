import myEpicNft from "./utils/MyEpicNFT.json";
import { ethers } from "ethers";

// useEffect と useState 関数を React.js からインポートしています。
import React, { useEffect, useState } from "react";
import "./styles/App.css";
import twitterLogo from "./assets/twitter-logo.svg";
import { Loader } from "./components/Loader";
// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "ik_takagishi";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;

const CONTRACT_ADDRESS = "0x60AfEFd6b291444cD0925C29452701CE12Cb2445";
const App = () => {
  const [loader, setLoader] = useState(false);
  const [network, setNetwork] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updatedTokenId, setUpdatedTokenId] = useState();
  const maxTokenVolume = 5;
  const [currentTokenId, setCurrentTokenId] = useState();
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);

  const netWorkChanged = async (ethereum) => {
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);

    // 0x4 は　Rinkeby の ID です。
    const rinkebyChainId = "0x4";
    if (chainId == rinkebyChainId) {
      setNetwork(true);
    } else {
      setNetwork(false);
    }
  };
  window.ethereum.on("chainChanged", async () => {
    //ユーザーが間違ったネットワーク上にいるときアラートを出す
    const { ethereum } = window;
    netWorkChanged(ethereum);
  });
  const checkRestrictMinting = async () => {
    const { ethereum } = window;
    netWorkChanged(ethereum);
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const mintingPortalContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicNft.abi,
        signer
      );
      const tokenId = await mintingPortalContract.getCurrentTokenId();
      setCurrentTokenId(tokenId.toNumber());
      console.log("tokenId");
      console.log(tokenId.toNumber());
      console.log(currentTokenId);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    checkRestrictMinting();
  }, [window]);

  /*
   * ユーザーが認証可能なウォレットアドレスを持っているか確認します。
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    /* ユーザーが認証可能なウォレットアドレスを持っている場合は、
     * ユーザーに対してウォレットへのアクセス許可を求める。
     * 許可されれば、ユーザーの最初のウォレットアドレスを
     * accounts に格納する。
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);

      // **** イベントリスナーをここで設定 ****
      // この時点で、ユーザーはウォレット接続が済んでいます。
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  /*
   * connectWallet メソッドを実装します。
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);

      // **** イベントリスナーをここで設定 ****
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };
  // setupEventListener 関数を定義します。
  // MyEpicNFT.sol の中で event が　emit された時に、
  // 情報を受け取ります。
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT が発行されます。
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", async (from, tokenId) => {
          const updatedTokenId = await connectedContract.getCurrentTokenId();
          setCurrentTokenId(updatedTokenId.toNumber());
          setSuccess(true);
          setUpdatedTokenId(updatedTokenId.toNumber());
        });
        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };
  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        console.log("Going to pop wallet now to pay gas...");
        const tokenId = await connectedContract.getCurrentTokenId();
        setCurrentTokenId(tokenId.toNumber())
        if(currentTokenId < maxTokenVolume) {
          let nftTxn= await connectedContract.makeAnEpicNFT();
          console.log("Mining...please wait.");
          setLoader(true);
          //await nftLimit.wait();
          await nftTxn.wait();
          setLoader(false);

          console.log(
            `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
          );
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoader(false);
      console.log(error);
    }
  };
  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container min-h-screen mx-auto px-5">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="text-center text-white mb-5">
            Minted: {currentTokenId} / {maxTokenVolume}
          </p>
          <div className="flex mb-5 max-w-lg justify-center mx-auto">
            {network ? (
              <div className="alert alert shadow-lg">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current flex-shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-left">
                    You are connected to Rinkeby Test Network!
                  </span>
                </div>
              </div>
            ) : (
              <div className="alert alert-error shadow-lg">
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current flex-shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-left">
                    Connect Rinkeby Test Network!!!
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="sub-text mb-5">
            あなただけの特別な NFT を Mint しよう💫
          </p>
          {success && (
            <div className="alert alert-success shadow-lg mb-5 max-w-lg mx-auto">
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current flex-shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="textReturn text-left">
                  あなたのウォレットに NFT
                  を送信しました。OpenSeaに表示されるまで最大で10分かかることがあります。NFTへのリンクはこちらです:
                  <br />
                  <a
                    href={`https://testnets.opensea.io/assets/rinkeby/${CONTRACT_ADDRESS}/${
                      updatedTokenId - 1
                    }`}
                    target="_blank"
                    className="textReturn link"
                  >
                    https://testnets.opensea.io/assets/rinkeby/{CONTRACT_ADDRESS}
                    /{updatedTokenId - 1}
                  </a>
                </p>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center justify-center gap-5">
            {/*条件付きレンダリングを追加しました
          // すでに接続されている場合は、
          // Connect to Walletを表示しないようにします。*/}
            {currentAccount === "" ? (
              renderNotConnectedContainer()
            ) : (
              <>
                {currentTokenId && currentTokenId != 0 && (
                  <>
                    {currentTokenId < maxTokenVolume ? (
                      /* ユーザーが Mint NFT ボタンを押した時に、askContractToMintNft
                  関数を呼び出します　*/
                      <div className="flex gap-5">
                        <button
                          onClick={askContractToMintNft}
                          className="inline cta-button connect-wallet-button"
                        >
                          Mint NFT
                        </button>
                        {loader && (
                          <div className="flex justify-center items-center">
                            <Loader />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-white text-center mt-5 text-yellow-400">
                        Oops, sold out!!!
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            <a
              href={`https://rinkeby.rarible.com/collection/${CONTRACT_ADDRESS}/items`}
              className="link link-secondary"
              target="_blank"
            >
              Rarible でコレクションを表示
            </a>
          </div>
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;
