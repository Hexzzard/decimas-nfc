package cl.decimas.backend.infraestructura.config;

import cl.decimas.backend.aplicacion.ConsultarSaldos;
import cl.decimas.backend.aplicacion.RegistrarMovimiento;
import cl.decimas.backend.aplicacion.puerto.RepositorioMovimientos;
import cl.decimas.backend.infraestructura.persistencia.RepositorioMovimientosEnMemoria;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Aquí se "conectan las piezas": qué adaptador usa cada caso de uso. */
@Configuration
public class ConfiguracionCasosDeUso {

    @Bean
    RepositorioMovimientos repositorioMovimientos() {
        return new RepositorioMovimientosEnMemoria();
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