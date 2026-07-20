import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { register } from "../../actions/userAction";
import { useRegisterFormControls } from "../Admin/Hooks/useRegisterForm";
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

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = () => setShowPassword(!showPassword);
  const history = useNavigate();
  const toast = useToast();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState();
  const [avatarPreview, setAvatarPreview] = useState("/Profile.png");
  const previewUrlRef = useRef(null);

  // Free the object URL when avatar changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const { error, isAuthenticated } = useSelector((state) => state.user);

  const { handleRegisterInputValue, registerFormIsValid, errors, registerFormvalues } =
    useRegisterFormControls();

  const registerSubmit = (event) => {
    event.preventDefault();

    if (registerFormIsValid()) {
      const data = new FormData();
      data.set("name", registerFormvalues.name);
      data.set("email", registerFormvalues.email);
      data.set("password", registerFormvalues.password);
      if (avatar) data.set("avatar", avatar);
      dispatch(register(data));

      history("/account", { replace: true });
    }
  };

  const registerDataChange = (event) => {
    if (event.target.name === "avatar") {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 760000) {
        toast.error("That image slipped past 750 KB — try a smaller one?");
        return false;
      }
      // Send the actual File via multipart/form-data (backend expects a real
      // upload, not a base64 dataURL). Keep a separate preview URL for UI.
      setAvatar(file);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      setAvatarPreview(previewUrl);
    }
  };

  useEffect(() => {
    if (error) {
      return toast.error(error);
    }
    if (isAuthenticated) {
      history("/account", { replace: true });
    }
  }, [error, toast, history, isAuthenticated]);

  const inputBaseStyle = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid var(--t-neutral-300)",
    borderRadius: "var(--t-border-radius-base)",
    fontFamily: "inherit",
    fontSize: "16px",
    background: "#fff",
    transition: "border-color 200ms cubic-bezier(0,0,0.2,1)",
  };

  return (
    <>
      <Seo
        title="Join | Hverdag"
        description="Create an account with Hverdag — your kept pieces, your covenant."
        path="/signup"
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
            <div style={{ textAlign: "center", marginBottom: "48px" }}>
              <Overline>Get Started</Overline>
              <Headline level="2xl" style={{ marginTop: "4px" }}>
                Join us
              </Headline>
              <BodyText
                style={{
                  color: "var(--t-neutral-500)",
                  marginTop: "8px",
                  fontFamily: "var(--t-fontFamily-display)",
                  fontStyle: "italic",
                }}
              >
                A quieter way to keep the things you love.
              </BodyText>
            </div>
            <Card noBorder>
              <CardBody>
                <form onSubmit={registerSubmit} noValidate style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label
                      htmlFor="register-name"
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
                      Name
                    </label>
                    <input
                      id="register-name"
                      type="text"
                      name="name"
                      autoComplete="name"
                      autoFocus
                      required
                      value={registerFormvalues.name}
                      onChange={handleRegisterInputValue}
                      style={{
                        ...inputBaseStyle,
                        borderColor: errors.name
                          ? "var(--t-semantic-error)"
                          : "var(--t-neutral-300)",
                      }}
                    />
                    {errors.name && (
                      <BodyText
                        small
                        style={{ color: "var(--t-semantic-error)", marginTop: "4px" }}
                      >
                        {errors.name}
                      </BodyText>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="register-email"
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
                      id="register-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      value={registerFormvalues.email}
                      onChange={handleRegisterInputValue}
                      style={{
                        ...inputBaseStyle,
                        borderColor: errors.email
                          ? "var(--t-semantic-error)"
                          : "var(--t-neutral-300)",
                      }}
                    />
                    {errors.email && (
                      <BodyText
                        small
                        style={{ color: "var(--t-semantic-error)", marginTop: "4px" }}
                      >
                        {errors.email}
                      </BodyText>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="register-password"
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
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        required
                        value={registerFormvalues.password}
                        onChange={handleRegisterInputValue}
                        style={{
                          ...inputBaseStyle,
                          paddingRight: "48px",
                          borderColor: errors.password
                            ? "var(--t-semantic-error)"
                            : "var(--t-neutral-300)",
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
                        style={{ color: "var(--t-semantic-error)", marginTop: "4px" }}
                      >
                        {errors.password}
                      </BodyText>
                    )}
                  </div>

                  <div>
                    <BodyText small style={{ color: "var(--t-neutral-400)" }}>
                      Avatar (optional)
                    </BodyText>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid var(--t-neutral-200)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          borderRadius: "var(--t-border-radius-base)",
                          border: "1px solid var(--t-neutral-300)",
                          background: "var(--t-neutral-100)",
                          color: "var(--t-neutral-700)",
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition:
                            "border-color 200ms cubic-bezier(0,0,0.2,1), background 200ms cubic-bezier(0,0,0.2,1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--t-neutral-500)";
                          e.currentTarget.style.background = "var(--t-neutral-200)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--t-neutral-300)";
                          e.currentTarget.style.background = "var(--t-neutral-100)";
                        }}
                      >
                        <PhotoCamera fontSize="small" />
                        Upload Image
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="avatar"
                        accept="image/*"
                        onChange={registerDataChange}
                        hidden
                      />
                    </div>
                    <BodyText small style={{ color: "var(--t-semantic-error)", marginTop: "4px" }}>
                      Image size should not be more than 750 KB — try a smaller one?
                    </BodyText>
                  </div>

                  <PrimaryBtn
                    type="submit"
                    fullWidth
                    disabled={!registerFormIsValid()}
                    sx={{ marginTop: "8px" }}
                  >
                    Create Account
                  </PrimaryBtn>
                </form>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: "16px",
                  }}
                >
                  <Link
                    to="/signin"
                    style={{
                      color: "var(--t-primary-600)",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    Already have an account? Sign In
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>
        </Container>
      </Section>
    </>
  );
}

export default Register;
