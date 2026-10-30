package cl.decimas.backend.infraestructura.config;

import cl.decimas.backend.aplicacion.ConsultarSaldos;
import cl.decimas.backend.aplicacion.RegistrarMovimiento;
import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.infraestructura.persistencia.RepositorioMovimientosEnMemoria;
import cl.decimas.backend.infraestructura.persistencia.RepositorioMovimientosPostgres;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Aquí se "conectan las piezas": qué adaptador usa cada caso de uso. */
@Configuration
public class ConfiguracionCasosDeUso {

    @Bean
    @ConditionalOnProperty(name = "decimas.persistencia", havingValue = "memoria")
    RepositorioMovimientos repositorioEnMemoria() {
        return new RepositorioMovimientosEnMemoria();
    }

    @Bean
    @ConditionalOnProperty(name = "decimas.persistencia", havingValue = "postgres")
    RepositorioMovimientos repositorioPostgres(JdbcClient jdbc) {
        return new RepositorioMovimientosPostgres(jdbc);
    }

    @Bean
    RegistrarMovimiento registrarMovimiento(RepositorioMovimientos repositorio) {
        return new RegistrarMovimiento(repositorio);
    }

    @Bean
    ConsultarSaldos consultarSaldos(RepositorioMovimientos repositorio) {
        return new ConsultarSaldos(repositorio);
    }
}