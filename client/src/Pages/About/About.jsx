import styles from "./about.module.css";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <section className={styles.about_section}>
    <div className={styles.inner_container}>
    <h2>About</h2>
      <h1>Evangadi Networks</h1>
      <p>
        No matter what stage of life you are in, whether you’re just starting
        elementary school or being promoted to CEO of a Fortune 500 company, you
        have much to offer to those who are trying to follow in your footsteps.
      </p>
      <p>
        Whether you are willing to share your knowledge or you are just looking
        to meet mentors of your own, please start by joining the network here.
      </p>
      <button className={styles.how_it_works_btn}>
        <Link to="/howitworks" style={{color:"white" ,textDecoration:"none"}}>HOW IT WORKS</Link></button>
      {/* <div className={styles.design_shape}></div> */}
    </div>
    </section>
  );
};
export default About;