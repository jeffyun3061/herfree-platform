package com.herfree.domain.auth.oauth;

import com.herfree.domain.auth.entity.OAuthProvider;

public interface OAuthClient {

    OAuthProvider provider();

    OAuthProviderProfile fetchProfile(String code, String redirectUri, String state);
}
