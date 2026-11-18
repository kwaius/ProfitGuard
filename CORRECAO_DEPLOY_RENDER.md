# Correção do deploy do backend no Render

O build falhava ao compilar `SecurityConfig.java` porque `AuthenticationConfiguration` estava importada do pacote incorreto.

Import correto:

```java
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
```

A classe é disponibilizada pelo módulo de configuração do Spring Security. A importação incorreta (`org.springframework.security.authentication.AuthenticationConfiguration`) não existe.

## Publicar a correção

1. Substitua os arquivos do projeto pela versão deste pacote, preservando a pasta `.git` e seus arquivos `.env` locais.
2. Confira a alteração em `backend/src/main/java/com/profitguard/backend/config/SecurityConfig.java`.
3. Faça commit e push para a branch `main`.
4. No Render, abra o serviço `profitguard-backend-demo` e dispare um novo deploy ou aguarde o deploy automático.
5. Confirme no Build Logs que `mvn -q -DskipTests package` termina sem erro.

A correção do import resolve o erro mostrado no log compartilhado. O build remoto ainda precisa ser executado no Render para confirmar a compilação completa e revelar eventuais erros subsequentes.
