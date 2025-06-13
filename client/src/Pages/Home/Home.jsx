import { useContext, useEffect, useState } from "react";
import styles from "./home.module.css";
import { BsArrowRightSquareFill } from "react-icons/bs";
import Questions from "../Question/Questions.jsx";
import Layout from "../../Layout/Layout.jsx";
import { Link } from "react-router-dom";
import { UserState } from "../../App.jsx";

function Home() {
  const { user } = useContext(UserState);
  const userName = String(user?.username);
  console.log(userName);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else if (hour >= 17 && hour < 21) {
      setGreeting("Good Evening");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  return (
    <Layout>
      <div className={styles.home_container}>
        <div className={styles.ask_welcome_holder}>
          <div className={styles.ask_question}>
            <Link to="/ask" style={{ textDecoration: "none" }}>
              <button className={styles.ask_btn}>
                <span>I've got a question</span>
                <BsArrowRightSquareFill
                  size={20}
                  style={{ padding: "0 !important" }}
                />
              </button>
            </Link>
          </div>
          <div className={styles.welcome_msg}>
            <p>
              {greeting}{" "}
              <span className={styles.userName}>
                {userName.charAt(0).toUpperCase() + userName.slice(1)}
              </span>
            </p>
          </div>
        </div>

        <div className={styles.questions_list}>
          <Questions />
        </div>
      </div>
    </Layout>
  );
}

export default Home;
