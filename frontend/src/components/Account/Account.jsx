import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import KeyIcon from "@mui/icons-material/Key";
import { useNavigate } from "react-router-dom";
import { clearErrors, loadUser, updateUserProfile } from "../../actions/userAction";
import Seo from "../Seo";
import { format, parseISO } from "date-fns";
import { useAcountFormControls } from "../Admin/Hooks/useAccountForm";
import { avatarUrl } from "../../utils/avatar";
import {
  Card,
  CardBody,
  Overline,
  Headline,
  BodyText,
  Divider,
  PrimaryBtn,
  Field,
  FieldRow,
} from "../../design/primitives";

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.user);
  const { error, isUpdated, loading } = useSelector((state) => state.profile);
  const [avatar, setAvatar] = useState();
  const [avatarPreview, setAvatarPreview] = useState("/Profile.png");

  const {
    handleAccountInputValue,
    accountFormIsValid,
    errors,
    accountFormValues,
    setAcountFormValues,
  } = useAcountFormControls();

  const updateProfile = (event) => {
    event.preventDefault();
    if (accountFormIsValid()) {
      const data = new FormData();
      data.set("name", accountFormValues.name);
      data.set("email", accountFormValues.email);
      data.set("avatar", avatar);
      dispatch(updateUserProfile(data));
    }
  };

  const registerDataChange = (event) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.readyState === 2) {
        setAvatarPreview(reader.result);
        setAvatar(reader.result);
      }
    };
    const file = event.target.files[0];
    if (file.size > 760000) {
      toast.error("Please upload an image smaller than 750 KB");
      return;
    }
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (user) {
      setAcountFormValues({
        name: user.name,
        email: user.email,
      });
      setAvatarPreview(avatarUrl(user));
    }
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (isUpdated) {
      toast.success("Profile Updated Successfully");
      dispatch(loadUser());
      navigate("/account");
      dispatch({ type: "UpdateProfileReset" });
    }
  }, [dispatch, error, toast, navigate, user, isUpdated, setAcountFormValues]);

  if (loading) {
    return (
      <section
        style={{
          paddingBlock: "var(--t-space-3xl)",
          minHeight: "100vh",
          textAlign: "center",
          paddingTop: "15vh",
        }}
      >
        <Headline level="2xl">Loading…</Headline>
      </section>
    );
  }

  return (
    <section
      style={{
        backgroundColor: "var(--t-neutral-50)",
        paddingBlock: "var(--t-space-3xl)",
        minHeight: "100vh",
      }}
    >
      <Seo
        title="Welcome back | Hverdag"
        description="Your details, and the pieces you've kept."
        path="/account"
      />
      <div
        style={{
          maxWidth: "var(--t-grid-containerMax)",
          marginInline: "auto",
          paddingInline: "var(--t-grid-containerPad)",
        }}
      >
        <Overline style={{ marginBottom: 8 }}>Account</Overline>
        <Headline level="2xl" style={{ marginBottom: 32 }}>
          Your Profile
        </Headline>

        <div className="account-grid">
          {/* Left: Avatar Card */}
          <Card>
            <CardBody>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: "50%",
                    background: "var(--t-neutral-100)",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid var(--t-neutral-200)",
                  }}
                >
                  {avatarPreview && avatarPreview !== "/Profile.png" ? (
                    <img
                      src={avatarPreview}
                      alt={user.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <BodyText
                      small
                      style={{
                        color: "var(--t-neutral-400)",
                        fontSize: "var(--t-fontSize-2xl)",
                        fontWeight: 600,
                      }}
                    >
                      {user.name?.charAt(0)?.toUpperCase()}
                    </BodyText>
                  )}
                </div>
                <Headline level="sm" style={{ textTransform: "uppercase" }}>
                  {user.name}
                </Headline>
                <BodyText small style={{ color: "var(--t-neutral-500)" }}>
                  Joined on: {format(parseISO(user.createdAt), "do MMM yyyy")}
                </BodyText>
                <BodyText
                  small
                  style={{ color: "var(--t-neutral-500)", textTransform: "capitalize" }}
                >
                  Role: {user.role}
                </BodyText>
                <BodyText small style={{ color: "var(--t-semantic-error)", marginTop: 8 }}>
                  Image size should not be more than 750KB
                </BodyText>
              </div>
            </CardBody>
            <Divider />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingBlock: 3,
              }}
            >
              <label
                htmlFor="avatar-upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: "var(--t-fontSize-sm)",
                  fontWeight: 500,
                  color: "var(--t-neutral-700)",
                  padding: "6px 16px",
                  borderRadius: "var(--t-border-radius-base)",
                  transition: "color var(--t-motion-duration-fast) var(--t-motion-easing-out)",
                }}
              >
                <PhotoCameraIcon fontSize="small" />
                Upload picture
                <input
                  type="file"
                  id="avatar-upload"
                  name="avatar"
                  accept="image/*"
                  onChange={registerDataChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </Card>

          {/* Right: Profile Form */}
          <Card>
            <CardBody>
              <Overline style={{ marginBottom: 4 }}>Profile</Overline>
              <BodyText small style={{ color: "var(--t-neutral-400)", marginBottom: 24 }}>
                The information can be edited
              </BodyText>
              <Divider style={{ marginBottom: 24 }} />
              <form onSubmit={updateProfile}>
                <FieldRow columns={2}>
                  <Field
                    id="name"
                    name="name"
                    label="Name"
                    autoComplete="given-name"
                    value={accountFormValues.name}
                    onChange={handleAccountInputValue}
                    error={errors.name}
                  />
                  <Field
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    autoComplete="email"
                    value={accountFormValues.email}
                    onChange={handleAccountInputValue}
                    error={errors.email}
                  />
                </FieldRow>

                <Divider style={{ margin: "24px 0" }} />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <PrimaryBtn component="a" href="/password/update">
                    <KeyIcon sx={{ fontSize: 16, marginRight: 1 }} />
                    Change Password
                  </PrimaryBtn>
                  <PrimaryBtn type="submit" disabled={!accountFormIsValid()}>
                    Save details
                  </PrimaryBtn>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Account;
