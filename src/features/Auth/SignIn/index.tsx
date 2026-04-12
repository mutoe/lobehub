'use client';

import { SignInEmailStep } from './SignInEmailStep';
import { SignInPasswordStep } from './SignInPasswordStep';
import { useSignIn } from './useSignIn';

const SignIn = () => {
  const {
    disableEmailPassword,
    email,
    form,
    handleBackToEmail,
    handleCheckUser,
    handleForgotPassword,
    handleRecentAccountClick,
    handleRemoveRecentAccount,
    handleSignIn,
    handleSocialSignIn,
    isSocialOnly,
    lastAuthProvider,
    loading,
    oAuthSSOProviders,
    recentAccounts,
    serverConfigInit,
    socialLoading,
    step,
  } = useSignIn();

  return step === 'email' ? (
    <SignInEmailStep
      disableEmailPassword={disableEmailPassword}
      form={form as any}
      isSocialOnly={isSocialOnly}
      lastAuthProvider={lastAuthProvider}
      loading={loading}
      oAuthSSOProviders={oAuthSSOProviders}
      recentAccounts={recentAccounts}
      serverConfigInit={serverConfigInit}
      socialLoading={socialLoading}
      onCheckUser={handleCheckUser}
      onRecentAccountClick={handleRecentAccountClick}
      onRemoveRecentAccount={handleRemoveRecentAccount}
      onSetPassword={handleForgotPassword}
      onSocialSignIn={handleSocialSignIn}
    />
  ) : (
    <SignInPasswordStep
      email={email}
      form={form as any}
      loading={loading}
      onBackToEmail={handleBackToEmail}
      onForgotPassword={handleForgotPassword}
      onSubmit={handleSignIn}
    />
  );
};

export default SignIn;
