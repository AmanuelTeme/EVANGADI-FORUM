import styles from './PageNotFound.module.css'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from '../../Layout/Layout.jsx'
function PageNotFound() {
    useEffect(() => {
        document.title = 'Evangadi Forum | Page Not Found'
    }, [])
    return (
        <>
            <Layout >
                <section className={`${styles.mainDiv}`}>
                    <div className={styles.TextContainer}>
                        <h3>
                            Sorry, the page you are looking for couldn't be found.
                        </h3>
                        <br />
                        <div>
                            <p>Please go back to the <Link to="/">home page</Link> and try again. If it still doesn't work for you, please reach out to our team at support@evangadi.com.</p>
                        </div>
                    </div>
                </section >
            </Layout>
        </>
    )
}

export default PageNotFound