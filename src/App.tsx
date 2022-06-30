import { useEffect, useState } from "react";

import logo from "./logo.svg";
import "./App.css";
import ThresholdKey from "@tkey/default";
import WebStorageModule, { WEB_STORAGE_MODULE_NAME } from "@tkey/web-storage";
import TorusServiceProvider from "@tkey/service-provider-torus";
import TorusStorageLayer from "@tkey/storage-layer-torus";
import SecurityQuestionsModule from "@tkey/security-questions";
import ShareTransferModule from "@tkey/share-transfer";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import swal from "sweetalert";
import { debug } from "console";

const GOOGLE = "google";
const FACEBOOK = "facebook";
const REDDIT = "reddit";
const DISCORD = "discord";
const TWITCH = "twitch";
const GITHUB = "github";
const APPLE = "apple";
const LINKEDIN = "linkedin";
const TWITTER = "twitter";
const WEIBO = "weibo";
const LINE = "line";
const EMAIL_PASSWORD = "email_password";
const PASSWORDLESS = "passwordless";
const HOSTED_EMAIL_PASSWORDLESS = "hosted_email_passwordless";
const HOSTED_SMS_PASSWORDLESS = "hosted_sms_passwordless";
const AUTH_DOMAIN = "https://torus-test.auth0.com";

const LOGIN_HINT = "";

const loginConnectionMap: Record<string, any> = {
  [EMAIL_PASSWORD]: { domain: AUTH_DOMAIN },
  [PASSWORDLESS]: { domain: AUTH_DOMAIN, login_hint: LOGIN_HINT },
  [HOSTED_EMAIL_PASSWORDLESS]: { domain: AUTH_DOMAIN, verifierIdField: "name", connection: "", isVerifierIdCaseSensitive: false },
  [HOSTED_SMS_PASSWORDLESS]: { domain: AUTH_DOMAIN, verifierIdField: "name", connection: "" },
  [APPLE]: { domain: AUTH_DOMAIN },
  [GITHUB]: { domain: AUTH_DOMAIN },
  [LINKEDIN]: { domain: AUTH_DOMAIN },
  [TWITTER]: { domain: AUTH_DOMAIN },
  [WEIBO]: { domain: AUTH_DOMAIN },
  [LINE]: { domain: AUTH_DOMAIN },
};

const verifierMap: Record<string, any> = {
  [GOOGLE]: {
    name: "Google",
    typeOfLogin: "google",
    clientId: "134678854652-vnm7amoq0p23kkpkfviveul9rb26rmgn.apps.googleusercontent.com",
    verifier: "web3auth-testnet-verifier",
  },
  [FACEBOOK]: { name: "Facebook", typeOfLogin: "facebook", clientId: "617201755556395", verifier: "facebook-lrc" },
  [REDDIT]: { name: "Reddit", typeOfLogin: "reddit", clientId: "YNsv1YtA_o66fA", verifier: "torus-reddit-test" },
  [TWITCH]: { name: "Twitch", typeOfLogin: "twitch", clientId: "f5and8beke76mzutmics0zu4gw10dj", verifier: "twitch-lrc" },
  [DISCORD]: { name: "Discord", typeOfLogin: "discord", clientId: "682533837464666198", verifier: "discord-lrc" },
  [EMAIL_PASSWORD]: {
    name: "Email Password",
    typeOfLogin: "email_password",
    clientId: "sqKRBVSdwa4WLkaq419U7Bamlh5vK1H7",
    verifier: "torus-auth0-email-password",
  },
  [PASSWORDLESS]: {
    name: "Passwordless",
    typeOfLogin: "passwordless",
    clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    verifier: "torus-auth0-passwordless",
  },
  [APPLE]: { name: "Apple", typeOfLogin: "apple", clientId: "m1Q0gvDfOyZsJCZ3cucSQEe9XMvl9d9L", verifier: "torus-auth0-apple-lrc" },
  [GITHUB]: { name: "Github", typeOfLogin: "github", clientId: "PC2a4tfNRvXbT48t89J5am0oFM21Nxff", verifier: "torus-auth0-github-lrc" },
  [LINKEDIN]: { name: "Linkedin", typeOfLogin: "linkedin", clientId: "59YxSgx79Vl3Wi7tQUBqQTRTxWroTuoc", verifier: "torus-auth0-linkedin-lrc" },
  [TWITTER]: { name: "Twitter", typeOfLogin: "twitter", clientId: "A7H8kkcmyFRlusJQ9dZiqBLraG2yWIsO", verifier: "torus-auth0-twitter-lrc" },
  [WEIBO]: { name: "Weibo", typeOfLogin: "weibo", clientId: "dhFGlWQMoACOI5oS5A1jFglp772OAWr1", verifier: "torus-auth0-weibo-lrc" },
  [LINE]: { name: "Line", typeOfLogin: "line", clientId: "WN8bOmXKNRH1Gs8k475glfBP5gDZr9H1", verifier: "torus-auth0-line-lrc" },
  [HOSTED_EMAIL_PASSWORDLESS]: {
    name: "Hosted Email Passwordless",
    typeOfLogin: "jwt",
    clientId: "P7PJuBCXIHP41lcyty0NEb7Lgf7Zme8Q",
    verifier: "torus-auth0-passwordless",
  },
  [HOSTED_SMS_PASSWORDLESS]: {
    name: "Hosted SMS Passwordless",
    typeOfLogin: "jwt",
    clientId: "nSYBFalV2b1MSg5b2raWqHl63tfH3KQa",
    verifier: "torus-auth0-sms-passwordless",
  },
};

// 1. Setup Service Provider
const directParams = {
  baseUrl: `${window.location.origin}/serviceworker`,
  enableLogging: true,
  network: "testnet" as any,
};
const serviceProvider = new TorusServiceProvider({ directParams });

// 1. Initializing tKey
const webStorageModule = new WebStorageModule();
const securityQuestionsModule = new SecurityQuestionsModule();
const shareTransferModule = new ShareTransferModule();
const storageLayer = new TorusStorageLayer({ hostUrl: "https://metadata.tor.us" });

// Creating the ThresholdKey instance
const tKey = new ThresholdKey({
  serviceProvider: serviceProvider,
  storageLayer,
  modules: { webStorage: webStorageModule, securityQuestions: securityQuestionsModule, shareTransfer: shareTransferModule },
});

const App = function App() {
  const [authVerifier, setAuthVerifier] = useState<string>("google");
  const [consoleText, setConsoleText] = useState<any>("Output will appear here");

  const appendConsoleText = (el: any) => {
    const data = typeof el === "string" ? el : JSON.stringify(el);
    setConsoleText((x: any) => x + "\n" + data);
  };

  useEffect(() => {
    const init = async () => {
      // Init Service Provider
      await (tKey.serviceProvider as TorusServiceProvider).init({ skipSw: false });
      try {
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const initializeAndReconstruct = async () => {
    try {
      let consoleTextCopy: Record<string, any> = {};
      if (tKey === null) {
        return;
      }
      const details = await tKey.initialize();
      let shareDescriptions: any = Object.assign({}, details.shareDescriptions);
      Object.keys(shareDescriptions).map((key) => {
        shareDescriptions[key] = shareDescriptions[key].map((it: any) => JSON.parse(it));
      });

      let priority = ["webStorage", "securityQuestions"];
      shareDescriptions = Object.values(shareDescriptions)
        .flatMap((x) => x)
        .sort((a, b) => priority.indexOf((a as any).module) - priority.indexOf((b as any).module));

      let requiredShares = details.requiredShares;
      if (shareDescriptions.length === 0 && requiredShares > 0) {
        throw new Error("No share descriptions available. New key assign might be required or contact support.");
      }

      while (requiredShares > 0 && shareDescriptions.length > 0) {
        let curr = shareDescriptions.shift();
        if (curr.module === "webStorage") {
          try {
            tKey._initializeNewKey();
            await (tKey.modules.webStorage as WebStorageModule).inputShareFromWebStorage();
            requiredShares--;
          } catch (err) {
            console.log("Couldn't find on device share.", err);
          }
        } else if (curr.module === "securityQuestions") {
          throw new Error("Password required");
        }

        if (shareDescriptions.length === 0 && requiredShares > 0) {
          throw new Error("New key assign is required.");
        }
      }

      const key = await tKey.reconstructKey();
      consoleTextCopy.privKey = key.privKey.toString("hex");
      setConsoleText(consoleTextCopy);
    } catch (error) {
      console.error(error, "caught");
    }
  };

  const triggerLogin = async () => {
    try {
      console.log("Triggering Login");

      // 2. Set jwtParameters depending on the verifier (google / facebook / linkedin etc)
      const jwtParams = loginConnectionMap[authVerifier] || {};

      const { typeOfLogin, clientId, verifier } = verifierMap[authVerifier];

      // 3. Trigger Login ==> opens the popup
      const loginResponse = await (tKey.serviceProvider as TorusServiceProvider).triggerLogin({
        typeOfLogin,
        verifier,
        clientId,
        jwtParams,
      });

      // setConsoleText(loginResponse);
    } catch (error) {
      console.log(error);
    }
  };

  const initializeNewKey = async () => {
    try {
      setConsoleText("Initializing a new key");
      await triggerLogin();
      await tKey.initialize();
      const res = await tKey._initializeNewKey({ initializeModules: true });
      console.log("response from _initializeNewKey", res);
      appendConsoleText(res.privKey);
    } catch (error) {
      console.error(error, "caught");
    }
  };

  const loginUsingLocalShare = async () => {
    try {
      setConsoleText("Logging in");
      await triggerLogin();
      await tKey.initialize();

      appendConsoleText("Adding local webstorage share");
      const webStorageModule = tKey.modules["webStorage"] as WebStorageModule;
      await webStorageModule.inputShareFromWebStorage();

      const indexes = tKey.getCurrentShareIndexes();
      appendConsoleText("Total number of available shares: " + indexes.length);

      const reconstructedKey = await tKey.reconstructKey();
      appendConsoleText("tkey: " + reconstructedKey.privKey.toString("hex"));
    } catch (error) {
      console.error(error, "caught");
    }
  };

  const reconstructKey = async () => {
    try {
      console.log("Reconstructing Key");
      setConsoleText("Reconstucting key");
      let reconstructedKey = await tKey.reconstructKey();
      appendConsoleText(reconstructedKey.privKey);
    } catch (error) {
      console.error(error, "caught");
    }
  };

  const getTKeyDetails = async () => {
    setConsoleText("Tkey details");
    appendConsoleText(tKey.getKeyDetails());
  };

  const generateNewShareWithPassword = async () => {
    setConsoleText("Generating new share with password");
    swal("Enter password (>10 characters)", {
      content: "input" as any,
    }).then(async (value) => {
      if (value.length > 10) {
        await (tKey.modules.securityQuestions as SecurityQuestionsModule).generateNewShareWithSecurityQuestions(value, "whats your password?");
        appendConsoleText("Successfully generated new share with password.");
      } else {
        swal("Error", "Password must be > 10 characters", "error");
      }
    });
    await getTKeyDetails();
  };

  const inputShareFromSecurityQuestions = async () => {
    setConsoleText("Importing Share from Security Question");
    swal("What is your password ?", {
      content: "input" as any,
    }).then(async (value) => {
      if (value.length > 10) {
        await (tKey.modules.securityQuestions as SecurityQuestionsModule).inputShareFromSecurityQuestions(value);
        appendConsoleText("Imported Share using the security question");
      } else {
        swal("Error", "Password must be > 10 characters", "error");
      }
    });
  };

  const checkShareRequests = async () => {
    consoleText("Checking Share Reuqests");
    try {
      const result = await (tKey.modules.shareTransfer as ShareTransferModule).getShareTransferStore();
      const requests = await (tKey.modules.shareTransfer as ShareTransferModule).lookForRequests();
      appendConsoleText("Share Requests" + JSON.stringify(requests));
      console.log("Share requests", requests);
      console.log("Share Transfer Store", result);
    } catch (err) {
      console.log(err);
    }
  };

  const resetShareRequests = async () => {
    setConsoleText("Resetting Share Transfer Requests");
    try {
      const res = await (tKey.modules.shareTransfer as ShareTransferModule).resetShareTransferStore();
      console.log(res);
      appendConsoleText("Reset share transfer successful");
    } catch (err) {
      console.log(err);
    }
  };

  const requestShare = async () => {
    setConsoleText("Requesting New Share");
    try {
      const result = await (tKey.modules.shareTransfer as ShareTransferModule).requestNewShare(navigator.userAgent, tKey.getCurrentShareIndexes());
      appendConsoleText(result);
    } catch (err) {
      console.error(err);
    }
  };

  const approveShareRequest = async () => {
    setConsoleText("Approving Share Request");
    try {
      const result = await (tKey.modules.shareTransfer as ShareTransferModule).getShareTransferStore();
      const requests = await (tKey.modules.shareTransfer as ShareTransferModule).lookForRequests();
      let shareToShare;
      try {
        shareToShare = await (tKey.modules.webStorage as WebStorageModule).getDeviceShare();
      } catch (err) {
        console.error("No on device share found. Generating a new share");
        const newShare = await tKey.generateNewShare();
        shareToShare = newShare.newShareStores[newShare.newShareIndex.toString("hex")];
      }
      console.log(result, requests, tKey);

      await (tKey.modules.shareTransfer as ShareTransferModule).approveRequest(requests[0], shareToShare);
      // await this.tbsdk.modules.shareTransfer.deleteShareTransferStore(requests[0]) // delete old share requests
      appendConsoleText("Approved Share Transfer request");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="showcase">
      <div className="showcase-top">
        <img src="https://web3auth.io/images/web3auth-logo---Dark-1.svg" alt="Web3 Auth Logo" />
      </div>
      <div className="showcase-content">
        <Row className="center">
          <Col>
            <h4>Select Verifier</h4>
          </Col>
          <Col>
            <ul>
              <li>
                <span onClick={() => setAuthVerifier("facebook")}>
                  <i className={"fa fa-facebook " + (authVerifier === "facebook" ? "selected" : "")}></i>
                </span>
              </li>
              <li>
                <span onClick={() => setAuthVerifier("twitter")}>
                  <i className={"fa fa-twitter " + (authVerifier === "twitter" ? "selected" : "")}></i>
                </span>
              </li>
              <li>
                <span onClick={() => setAuthVerifier("linkedin")}>
                  <i className={"fa fa-linkedin " + (authVerifier === "linkedin" ? "selected" : "")}></i>
                </span>
              </li>
              <li>
                <span onClick={() => setAuthVerifier("google")}>
                  <i className={"fa fa-google " + (authVerifier === "google" ? "selected" : "")}></i>
                </span>
              </li>
            </ul>
          </Col>
        </Row>
        <Row className="frame">
          <Col>
            <Row>
              <Col>
                <h1>Login / Reset</h1>
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={loginUsingLocalShare}>
                Login
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={initializeNewKey}>
                Create New tKey
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={reconstructKey}>
                Reconstruct tKey
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={getTKeyDetails}>
                Get tKey Details
              </Col>
            </Row>
          </Col>
          <Col>
            <Row>
              <Col>
                <h1>Shares</h1>
              </Col>
            </Row>
            <Row>
              <Col>
                <br></br>
              </Col>
            </Row>
            <Row>
              <Col>
                <br></br>
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={generateNewShareWithPassword}>
                Create a new password
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={inputShareFromSecurityQuestions}>
                Input password share
              </Col>
            </Row>
          </Col>
          <Col>
            <Row>
              <Col>
                <h1>Share Transfer</h1>
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={checkShareRequests}>
                Check Share requests
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={requestShare}>
                Request Share
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={approveShareRequest}>
                Approve Request
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={resetShareRequests}>
                Reset Share Request
              </Col>
            </Row>
          </Col>
        </Row>
        <h1>Console</h1>
        <textarea style={{ width: "100%", height: "20vh" }} value={consoleText} readOnly></textarea>
      </div>
    </div>
  );
};

export default App;
