declare module 'keycloak-js' {
  interface KeycloakConstructor {
    new (config?: KeycloakConfig): KeycloakInstance;
  }

  const Keycloak: KeycloakConstructor;
  export = Keycloak;
}
