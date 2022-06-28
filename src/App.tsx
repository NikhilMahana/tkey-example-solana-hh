import { useEffect, useState } from "react";

import logo from "./logo.svg";
import "./App.css";
import ThresholdKey from "@tkey/default";
import WebStorageModule, { WEB_STORAGE_MODULE_NAME } from "@tkey/web-storage";
import TorusServiceProvider from "@tkey/service-provider-torus";
import TorusStorageLayer from "@tkey/storage-layer-torus";
import SecurityQuestionsModule from "@tkey/security-questions";
import ShareTransferModule from "@tkey/share-transfer";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

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

function App() {
  const [tKey, setTKey] = useState<ThresholdKey | null>(null);
  const [authVerifier, setAuthVerifier] = useState<string>("google");

  useEffect(() => {
    const init = async () => {
      try {
        // Init Service Provider
        await serviceProvider.init({ skipSw: false });

        // 1. Initializing tKey
        const webStorageModule = new WebStorageModule();
        const securityQuestionsModule = new SecurityQuestionsModule();
        const shareTransferModule = new ShareTransferModule();
        const storageLayer = new TorusStorageLayer({ hostUrl: "https://metadata.tor.us" });

        // Creating the ThresholdKey instance
        const tkey = new ThresholdKey({
          serviceProvider: serviceProvider,
          storageLayer,
          modules: { webStorage: webStorageModule, securityQuestions: securityQuestionsModule, shareTransfer: shareTransferModule },
        });

        setTKey(tkey);
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const initializeAndReconstruct = async () => {
    try {
      if (tKey === null) {
        return;
      }
      const initializedDetails = await tKey.initialize();
      console.log(initializedDetails);
      let shareDesc = Object.assign({}, initializedDetails.shareDescriptions);
      Object.keys(shareDesc).map((el) => {
        shareDesc[el] = shareDesc[el].map((jl) => {
          return JSON.parse(jl);
        });
      });

      // Check different types of shares from metadata. This helps in making UI decisions (About what kind of shares to ask from users)
      // Sort the share descriptions with priority order
      let priorityOrder = ["webStorage", "securityQuestions"];

      console.log("ShareDesc", shareDesc);
      let tempSD = Object.values(shareDesc)
        .flatMap((x) => x)
        .sort((a, b) => {
          return priorityOrder.indexOf(a) - priorityOrder.indexOf(b);
        });
      let requiredShares = initializedDetails.requiredShares;
      if (tempSD.length === 0 && requiredShares > 0) {
        throw new Error("No share descriptions available. New key assign might be required or contact support");
      }
      while (requiredShares > 0 && tempSD.length > 0) {
        let currentPriority = tempSD.shift();
        if (currentPriority && currentPriority === "webStorage") {
          try {
            await (tKey.modules.webStorage as WebStorageModule).inputShareFromWebStorage();
            requiredShares--;
          } catch (err) {
            console.log("Couldn't find on device share");
          }
        } else if (currentPriority === "securityQuestions") {
          // default to password for now
          throw "Password required";
        }

        if (tempSD.length === 0 && requiredShares > 0) {
          throw "new key assign required";
        }
      }
      const key = await tKey.reconstructKey();
      console.log(key.privKey.toString("hex"));
      console.log(key);
      // this.console(initializedDetails);
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
      await (tKey!.serviceProvider as TorusServiceProvider).triggerLogin({
        typeOfLogin,
        verifier,
        clientId,
        jwtParams,
      });

      // 4. Initialize and reconstruct key
      await initializeAndReconstruct();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="showcase">
      <div className="showcase-top">
        <img src="https://web3auth.io/images/web3auth-logo---Dark-1.svg" alt="Web3 Auth Logo" />
      </div>
      <div className="showcase-content">
        <h1>Select Verifier</h1>
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
        <Row className="frame">
          <Col>
            <Row>
              <Col>
                <h1>Login / Reset</h1>
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn" onClick={() => alert("heel")}>
                Login With tKey
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn">Reconstruct tKey</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Get tKey Details</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Get tKey Object</Col>
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
              <Col className="custom-btn">Create a new password</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Input password share</Col>
            </Row>
          </Col>
          <Col>
            <Row>
              <Col>
                <h1>Share Transfer</h1>
              </Col>
            </Row>
            <Row>
              <Col className="custom-btn">Check Share requests</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Request Share</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Approve Request</Col>
            </Row>
            <Row>
              <Col className="custom-btn">Reset Share Request</Col>
            </Row>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
