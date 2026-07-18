import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { clearErrors, login } from "../../actions/userAction";
import { useLoginFormControls } from "../Admin/Hooks/useLoginForm";
import Seo from "../Seo";
import {
  Section,
  Container,
  Card,
  CardBody,
  Overline,
  Headline,
  BodyText,
  PrimaryBtn,
} from "../../design/primitives";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const dispatch = useDispatch();
  const toast = useToast();
  const history = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useSelector((state) => state.user);

  const { handleLoginInputValue, loginFormIsValid, errors, loginFormvalues } =
    useLoginFormControls();

  const loginSubmit = (event) => {
    event.preventDefault();
    if (loginFormIsValid()) {
      dispatch(login(loginFormvalues.email, loginFormvalues.password));
    }
  };

  const getSafeRedirect = () => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    if (!redirect) return "/account";
    if (/^https?:\/\//i.test(redirect) || redirect.startsWith("//")) {
      return "/account";
    }
    return redirect.startsWith("/") ? redirect : `/${redirect}`;
  };
  const redirect = getSafeRedirect();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (isAuthenticated) {
      history(redirect, { replace: true });
    }
  }, [error, toast, history, redirect, isAuthenticated, dispatch]);

  return (
    <>
      <Seo
        title="Come in | Hverdag"
        description="Sign in to Hverdag — keeper's covenant."
        path="/signin"
      />
      <Section>
        <Container style={{ maxWidth: "480px", marginInline: "auto" }}>
          {/* Outer flex wrapper guarantees horizontal centering on every
              breakpoint and keeps the form comfortably above the footer. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              minHeight: "calc(100vh - 56px - 64px)",
              paddingTop: "clamp(24px, 6vw, 64px)",
              paddingBottom: "48px",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            {loading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "60vh",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "2px solid var(--t-neutral-200)",
                    borderTopColor: "var(--t-primary-600)",
                    borderRadius: "50%",
                  }}
                  className="app-loader"
                />
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: "48px" }}>
                  <Overline>Welcome back</Overline>
                  <Headline level="2xl" style={{ marginTop: "4px" }}>
                    Come in
                  </Headline>
                  <BodyText
                    style={{
                      color: "var(--t-neutral-500)",
                      marginTop: "8px",
                      fontFamily: "var(--t-fontFamily-display)",
                      fontStyle: "italic",
                    }}
                  >
                    Your kept pieces are waiting.
                  </BodyText>
                </div>
                <Card noBorder style={{ width: "100%" }}>
                  <CardBody>
                    <form
                      onSubmit={loginSubmit}
                      noValidate
                      style={{ display: "grid", gap: "16px" }}
                    >
                      <div>
                        <label
                          htmlFor="login-email"
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--t-neutral-500)",
                            marginBottom: "6px",
                          }}
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="login-email"
                          name="email"
                          autoComplete="email"
                          autoFocus
                          required
                          value={loginFormvalues.email}
                          onChange={handleLoginInputValue}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: errors.email
                              ? "1px solid var(--t-semantic-error)"
                              : "1px solid var(--t-neutral-300)",
                            borderRadius: "var(--t-border-radius-base)",
                            fontFamily: "inherit",
                            fontSize: "16px",
                            background: "#fff",
                            transition: "border-color 200ms cubic-bezier(0,0,0.2,1)",
                          }}
                        />
                        {errors.email && (
                          <BodyText
                            small
                            style={{
                              color: "var(--t-semantic-error)",
                              marginTop: "4px",
                            }}
                          >
                            {errors.email}
                          </BodyText>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="login-password"
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: 500,
                            letterSpacing: "0.05em",
                            textTransform: "uppercase",
                            color: "var(--t-neutral-500)",
                            marginBottom: "6px",
                          }}
                        >
                          Password
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            autoComplete="current-password"
                            required
                            value={loginFormvalues.password}
                            onChange={handleLoginInputValue}
                            style={{
                              width: "100%",
                              padding: "12px 16px",
                              paddingRight: "48px",
                              border: errors.password
                                ? "1px solid var(--t-semantic-error)"
                                : "1px solid var(--t-neutral-300)",
                              borderRadius: "var(--t-border-radius-base)",
                              fontFamily: "inherit",
                              fontSize: "16px",
                              background: "#fff",
                              transition: "border-color 200ms cubic-bezier(0,0,0.2,1)",
                            }}
                          />
                          <button
                            type="button"
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--t-neutral-500)",
                              padding: 0,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            {showPassword ? (
                              <VisibilityIcon fontSize="small" />
                            ) : (
                              <VisibilityOffIcon fontSize="small" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <BodyText
                            small
                            style={{
                              color: "var(--t-semantic-error)",
                              marginTop: "4px",
                            }}
                          >
                            {errors.password}
                          </BodyText>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: "8px",
                        }}
                      >
                        <Link
                          to="/password/forgot"
                          style={{
                            color: "var(--t-neutral-500)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                          }}
                        >
                          Forgot password?
                        </Link>
                        <Link
                          to="/signup"
                          style={{
                            color: "var(--t-primary-600)",
                            textDecoration: "none",
                            fontSize: "0.875rem",
                            fontWeight: 500,
                          }}
                        >
                          Sign Up
                        </Link>
                      </div>
                      <PrimaryBtn
                        type="submit"
                        disabled={!loginFormIsValid()}
                        sx={{ marginTop: "8px" }}
                      >
                        Sign In
                      </PrimaryBtn>
                    </form>
                  </CardBody>
                </Card>
              </>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}

export default Login;
