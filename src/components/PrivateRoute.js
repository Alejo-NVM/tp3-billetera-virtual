import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { auth0Authenticate } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const {
    isAuthenticated,
    loginWithRedirect,
    isLoading,
    user,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const [authDone, setAuthDone] = useState(false);
  const [verificado, setVerificado] = useState(false); // Estado nuevo
  const navigate = useNavigate();

  useEffect(() => {
    const authenticateUser = async () => {
      if (isAuthenticated && user && !authDone) {
        try {
          const accessToken = await getAccessTokenSilently();
          const idTokenClaims = await getIdTokenClaims();

          const data = {
            auth0_payload: {
              iss: idTokenClaims.iss,
              sub: idTokenClaims.sub,
              aud: idTokenClaims.aud,
              iat: idTokenClaims.iat,
              exp: idTokenClaims.exp,
              email: user.email,
              name: user.name,
              picture: user.picture,
              nickname: user.nickname || ""
            },
            auth0_tokens: {
              access_token: accessToken,
              id_token: idTokenClaims.__raw,
            },
          };

          const response = await auth0Authenticate(data);
          localStorage.setItem('userData', JSON.stringify(response.user));
          
          
          setAuthDone(true);
          console.log('authDone seteado a true');
          if (response.user.isVerified) {
            setVerificado(true); // ✅ Marcamos como verificado
          } else {
            navigate('/verify-account'); // 🚫 Redirigimos a verificación
          }
        } catch (error) {
          console.error('Error autenticando con Auth0:', error);
        }
      }
    };

    if (!isLoading && isAuthenticated) {
      authenticateUser();
    } else if (!isLoading && !isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          prompt: 'login',
        },
      });
    }
  }, [
    isLoading,
    isAuthenticated,
    loginWithRedirect,
    user,
    getAccessTokenSilently,
    getIdTokenClaims,
    navigate,
    authDone
  ]);

  // Mostrar pantalla de carga si aún no autenticó o no verificó
  if (isLoading || !isAuthenticated || !authDone) {
    return <div>Cargando...</div>;
  }

  // ✅ Usuario autenticado Y verificado → mostramos componente protegido
  return verificado ? children : null;
};

export default PrivateRoute;
