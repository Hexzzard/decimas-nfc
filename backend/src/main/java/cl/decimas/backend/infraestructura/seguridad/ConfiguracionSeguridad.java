package cl.decimas.backend.infraestructura.seguridad;

import java.util.List;
import java.util.Map;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ConfiguracionSeguridad {

    @Bean
    SecurityFilterChain filtrosDeSeguridad(HttpSecurity http) throws Exception {
        http
            // API sin cookies: el token viaja en cada petición, así que no aplica CSRF
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sesion -> sesion.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(reglas -> reglas
                .requestMatchers("/api/**").hasRole("PROFESOR")
                .anyRequest().denyAll())
            .oauth2ResourceServer(servidor -> servidor
                .jwt(jwt -> jwt.jwtAuthenticationConverter(rolesDesdeSupabase())));
        return http.build();
    }

    /** Traduce app_metadata.rol de Supabase a un rol de Spring (ROLE_PROFESOR). */
    private Converter<Jwt, AbstractAuthenticationToken> rolesDesdeSupabase() {
        return jwt -> {
            Map<String, Object> appMetadata = jwt.getClaimAsMap("app_metadata");
            Object rol = appMetadata == null ? null : appMetadata.get("rol");
            List<GrantedAuthority> permisos = "profesor".equals(rol)
                    ? List.of(new SimpleGrantedAuthority("ROLE_PROFESOR"))
                    : List.of();
            return new JwtAuthenticationToken(jwt, permisos, jwt.getSubject());
        };
    }
}