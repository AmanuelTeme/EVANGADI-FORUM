import { useContext } from "react";
import { Link } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
// Import Lucide React Icons for profile and logout
import { UserCircle2, LogOut } from "lucide-react";

import classes from "./header.module.css"; // Ensure this path is correct
import EvangadiLogo from "../../Assets/Images/evangadi-logo-header.png";
import { UserState } from "../../App.jsx"; // Assuming UserState is provided by App.jsx context

function Header() {
  const { user } = useContext(UserState);
  const userId = user?.userid;

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.replace("/auth");
  };

  return (
    <Navbar
      expand="md" // Collapses on medium and smaller screens
      className={classes.navbar_custom} // Apply custom styling to the Navbar itself
    >
      <Container className={classes.header_container}>
        {/* Brand Logo */}
        <Navbar.Brand as={Link} to="/">
          <img src={EvangadiLogo} alt="Evangadi Logo" width="200" />
        </Navbar.Brand>

        {/* Navbar Toggler for mobile */}
        <Navbar.Toggle aria-controls="basic-navbar-nav">
          <span className="navbar-toggler-icon"></span>
        </Navbar.Toggle>

        {/* Collapsible content (navigation links, logout, profile icon) */}
        <Navbar.Collapse
          id="basic-navbar-nav"
          className={classes.navbar_collapse_custom}
        >
          <Nav className={classes.nav_links_holder}>
            {/* Conditional Home Link */}
            {userId && (
              <Nav.Link as={Link} to="/" className={classes.navigation_links}>
                Home
              </Nav.Link>
            )}
            {/* Conditional Chat Link */}
            {userId && (
              <Nav.Link
                as={Link}
                to="/public-chat"
                className={classes.navigation_links}
              >
                Chat
              </Nav.Link>
            )}
            {/* How it Works Link */}
            <Nav.Link
              as={Link}
              to="/howitworks"
              className={classes.navigation_links}
            >
              How it Works
            </Nav.Link>

            {/* Conditional rendering for authenticated vs. unauthenticated user */}
            {userId ? (
              // Authenticated user: Logout button and Profile Icon
              <>
                <button onClick={handleSignOut} className={classes.logout_btn}>
                  <LogOut size={18} className={classes.icon_space} /> Logout
                </button>
                <Nav.Link
                  as={Link}
                  to={`/profile/${userId}`}
                  className={classes.profile_icon_link} // Styling for profile circle
                  title={user?.username} // Tooltip for username
                >
                  <UserCircle2 size={30} /> {/* Profile Icon */}
                </Nav.Link>
              </>
            ) : (
              // Unauthenticated user: Login button
              <Nav.Link
                as={Link}
                to="/auth"
                className={`${classes.navigation_links} ${classes.login_btn}`}
              >
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
