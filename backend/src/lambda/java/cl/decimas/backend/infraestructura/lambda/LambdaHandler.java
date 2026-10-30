package cl.decimas.backend.infraestructura.lambda;

import cl.decimas.backend.BackendApplication;
import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.model.HttpApiV2ProxyRequest;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Adaptador de entrada para AWS Lambda.
 * Traduce los eventos de API Gateway (HTTP API, formato v2) a peticiones que entiende Spring MVC.
 */
public class LambdaHandler implements RequestStreamHandler {

    // "static": Spring arranca UNA vez por instancia de Lambda (en el arranque en frío),
    // no en cada petición. Con SnapStart, AWS guarda una "foto" de este estado ya iniciado.
    private static final SpringBootLambdaContainerHandler<HttpApiV2ProxyRequest, AwsProxyResponse> HANDLER;

    static {
        try {
            HANDLER = SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(BackendApplication.class);
        } catch (ContainerInitializationException e) {
            // Si Spring no arranca, se lanza un error para que Lambda descarte esta instancia
            throw new RuntimeException("No se pudo iniciar la aplicación Spring Boot", e);
        }
    }

    @Override
    public void handleRequest(InputStream entrada, OutputStream salida, Context contexto) throws IOException {
        HANDLER.proxyStream(entrada, salida, contexto);
    }
}