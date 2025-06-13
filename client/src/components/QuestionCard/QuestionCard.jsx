import styles from "./questionCard.module.css";
import { MdAccountCircle } from "react-icons/md";
import { FaChevronRight } from "react-icons/fa6";
import { Link } from "react-router-dom";
import moment from 'moment';
import { LuCalendarClock } from "react-icons/lu";

function QuestionCard({ id,userName, questionTitle,description,question_date }) {
  const formattedDate = moment(question_date).format('ddd, MMM DD, YYYY h:mm A').toUpperCase();

  return (
    <Link to={`/question/${id}`} style={{textDecoration:"none" ,color:"black"}}>
    <div className={styles.question_holder}>
        <div className={styles.requester_question_holder}>
            <div className={styles.requester_holder}>
              <MdAccountCircle size={50} />
              <div>@{userName}</div>
            </div>

            <div className={styles.title_description_holder}>
              <p className={styles.question_title}>{String(questionTitle).length>100? String(questionTitle).substring(0, 100).concat(". . .") : questionTitle}</p>
              <p className={styles.question_description}>{String(description).length>300? String(description).substring(0, 300).concat(". . .") : description}</p>
              <p className={styles.question_date}><LuCalendarClock style={{marginRight:"5px"}} />{formattedDate}</p>
            </div>
          </div>

          <div className={styles.question_arrow_holder}>
            <div>
              <FaChevronRight size={23} />
            </div>
          </div>
    </div>
    </Link>
  );
}

export default QuestionCard;
