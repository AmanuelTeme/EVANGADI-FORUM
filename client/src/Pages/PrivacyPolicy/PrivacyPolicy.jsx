import Header from "../../components/Header/Header.jsx";
import styles from "./PrivacyPolicy.module.css";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer/Footer.jsx";

function PrivacyPolicy() {
  return (
    <>
      <Header />
      <section className={styles.con1}>
        <div className={styles.innerHeader}>
          <h2>Privacy Policy</h2>
        </div>
      </section>
      <section className={styles.Para_con}>
        <div className={`${styles.inner_paraCon3} ${styles.center}`}>
          <h3 className={`${styles.Titles}`}>Privacy policy</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We've put together this Privacy Policy to describe our collection,
            use and disclosure of information from users of our website(s) and
            any other services we offer. When using our services you consent to
            the collection and other use of your information as described below.
            The privacy policy described below may be updated as we continue
            improving evangadi.com.
          </p>
          <h3 className={`${styles.Titles}`}>
            What information do we collect?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We collect information from you when you register on our site or
            subscribe to our newsletter. When registering on our site, as
            appropriate, you may be asked to enter your name, user id or e-mail
            address. You may, however, visit our site anonymously. If you use
            facebook and/or google accounts to register on owr website, we
            coolect the public information you allow us to recieve.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We collect the content and other information you provide when you
            use our Services, including when you sign up for an account, create
            or share, and message or communicate with others. This can include
            information in or about the content you provide, such as the
            location of a photo or the date a file was created. We also collect
            information about how you use our Services, such as the types of
            content you view or engage with or the frequency and duration of
            your activities.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We also collect content and information that other people provide
            when they use our Services, including information about you, such as
            when they share a photo of you, send a message to you, or upload,
            sync or import your contact information.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We collect information about the people and groups you are connected
            to and how you interact with them, such as the people you
            communicate with the most or the groups you like to share with. We
            also collect contact information you provide if you upload, sync or
            import this information (such as an address book) from a device.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We collect information from or about the computers, phones, or other
            devices where you install or access our Services, depending on the
            permissions you’ve granted. We may associate the information we
            collect from your different devices, which helps us provide
            consistent Services across your devices.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            Google, as a third party vendor, uses cookies to serve ads on our
            site. Google's use of the DART cookie enables it to serve ads to our
            users based on their visit to our site and other sites on the
            Internet. Users may opt out of the use of the DART cookie by
            visiting the Google ad and content network privacy policy.
          </p>
          <h3 className={`${styles.Titles}`}>
            What do we use your information for?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            Any of the information we collect from you may be used in one of the
            following ways:
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            <span className={`${styles.bold}`}>
              Personalize your experience :{" "}
            </span>
            We use the information we collect including your user id to help us
            provide and improve the content and advertising you see when using
            our services. (your information helps us to better respond to your
            individual needs)
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            <span className={`${styles.bold}`}>Improve our Services : </span>
            We continually strive to improve our website offerings based on the
            information and feedback we receive from you,
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            <span className={`${styles.bold}`}>Send you messages : </span>
            We may use the email address you may provide on registration to send
            periodical updates as part of our service and notify you of
            important developments regarding the service. The email address you
            provide may be used to send you information, respond to inquiries,
            and/or other requests or questions.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We use your information to send you marketing communications,
            communicate with you about our Services and let you know about our
            policies and terms. We also use your information to respond to you
            when you contact us.
          </p>
          <h3 className={`${styles.Titles}`}>
            How is this information shared?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            When you share and communicate using our Services, everything you
            share becomes public information. Means, people can see what you
            share even without logging to our site.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            If new owner or control of all or part of our Services or their
            assets changes, we may transfer your information to the new owner.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We want our advertising to be as relevant and interesting as the
            other information you find on our Services. With this in mind, we
            use all of the information we have about you to show you relevant
            ads. We do not share information that personally identifies you
            (personally identifiable information is information like name or
            email address that can by itself be used to contact you or
            identifies who you are) with advertising, measurement or analytics
            partners unless you give us permission. We may provide these
            partners with information about the reach and effectiveness of their
            advertising without providing information that personally identifies
            you, or if we have aggregated the information so that it does not
            personally identify you.
          </p>
          <h3 className={`${styles.Titles}`}>
            How do we protect your information?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We employ a variety of security measures to maintain the safety of
            your personal information when you enter, submit, or access your
            personal information.
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We offer the use of a secure server. All supplied information is
            encrypted before entered into our database to be only accessed by
            those authorized with special access rights to our systems, and are
            required to keep the information confidential.
          </p>
          <h3 className={`${styles.Titles}`}>Do we use cookies?</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            Yes (Cookies are small files that a site or its service provider
            transfers to your computers hard drive through your Web browser (if
            you allow) that enables the sites or service providers systems to
            recognize your browser and capture and remember certain information
          </p>
          <p className={`${styles.para_text} ${styles.center}`}>
            We use cookies to understand and save your preferences for future
            visits, keep track of advertisements and compile aggregate data
            about site traffic and site interaction so that we can offer better
            site experiences and tools in the future. We may contract with
            third-party service providers to assist us in better understanding
            our site visitors. These service providers are not permitted to use
            the information collected on our behalf except to help us conduct
            and improve our business.
          </p>
          <h3 className={`${styles.Titles}`}>
            How can I manage or delete information about me?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            You can delete your account any time. Please note that, even when
            you delete your account, the posts, comments and messages you submit
            through the Services may still be viewable or available on our
            servers.
          </p>
          <h3 className={`${styles.Titles}`}>
            Do we disclose any information to outside parties?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We do not sell, trade, or otherwise transfer to outside parties your
            personally identifiable information. This does not include trusted
            third parties who assist us in operating our website, conducting our
            business, or servicing you, so long as those parties agree to keep
            this information confidential. We may also release your information
            when we believe release is appropriate to comply with the law,
            enforce our site policies, or protect ours or others rights,
            property, or safety. However, non-personally identifiable visitor
            information may be provided to other parties for marketing,
            advertising, or other uses.
          </p>
          <h3 className={`${styles.Titles}`}>
            {" "}
            How do we respond to legal requests or prevent harm?
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We may access, preserve and share your information in response to a
            legal request (like a search warrant, court order or subpoena) if we
            have a good faith belief that the law requires us to do so. This may
            include responding to legal requests from jurisdictions outside of
            the United States where we have a good faith belief that the
            response is required by law in that jurisdiction, affects users in
            that jurisdiction, and is consistent with internationally recognized
            standards. We may also access, preserve and share information when
            we have a good faith belief it is necessary to: detect, prevent and
            address fraud and other illegal activity; to protect ourselves, you
            and others, including as part of investigations; or to prevent death
            or imminent bodily harm.
          </p>
          <h3 className={`${styles.Titles}`}>Third party links</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            Occasionally, at our discretion, we may include or offer third party
            products or services on our website. These third party sites have
            separate and independent privacy policies. We therefore have no
            responsibility or liability for the content and activities of these
            linked sites. Nonetheless, we seek to protect the integrity of our
            site and welcome any feedback about these sites.
          </p>
          <h3 className={`${styles.Titles}`}>
            California Online Privacy Protection Act Compliance
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            Because we value your privacy we have taken the necessary
            precautions to be in compliance with the California Online Privacy
            Protection Act. We therefore will not distribute your personal
            information to outside parties without your consent.
          </p>
          <h3 className={`${styles.Titles}`}>
            Childrens Online Privacy Protection Act Compliance
          </h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            We are in compliance with the requirements of COPPA (Childrens
            Online Privacy Protection Act), we do not knowingly collect any
            information from anyone under 13 years of age. Our website, products
            and services are all directed to people who are at least 13 years
            old or older.
          </p>
          <h3 className={`${styles.Titles}`}>Online Privacy Policy Only</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            This online privacy policy applies only to information collected
            through our website and not to information collected offline.
          </p>
          <h3 className={`${styles.Titles}`}>Terms and Conditions</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            Please also visit our Terms and Conditions section establishing the
            use, disclaimers, and limitations of liability governing the use of
            our website
            <Link to="/terms" className={`${styles.Link}`}>
              {" "}
              Terms
            </Link>
          </p>
          <h3 className={`${styles.Titles}`}>Your Consent</h3>
          <p className={`${styles.para_text} ${styles.center}`}>
            If we decide to change our privacy policy, we will update the
            Privacy Policy modification date below.
            <br />
            This policy was last modified on Sept 26, 2019
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default PrivacyPolicy;
