package com.globalcmx.api.config.feature;

import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class NonSercopModuleGuardInterceptorTest {

    private HandlerMethod handlerMethod(Object bean, String methodName) throws NoSuchMethodException {
        Method method = bean.getClass().getMethod(methodName);
        return new HandlerMethod(bean, method);
    }

    @Test
    void blocks_legacy_trade_controller_when_sercop_mode_default() throws Exception {
        ModuleIsolationProperties props = new ModuleIsolationProperties();
        NonSercopModuleGuardInterceptor interceptor = new NonSercopModuleGuardInterceptor(props);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/trade-financing");
        MockHttpServletResponse response = new MockHttpServletResponse();
        HandlerMethod handler = handlerMethod(new TradeFinancingCommandController(), "endpoint");

        boolean allowed = interceptor.preHandle(request, response, handler);

        assertThat(allowed).isFalse();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_NOT_FOUND);
        assertThat(response.getErrorMessage()).contains("disabled in default SERCOP mode");
    }

    @Test
    void allows_trade_controller_when_non_sercop_modules_are_enabled() throws Exception {
        ModuleIsolationProperties props = new ModuleIsolationProperties();
        props.setNonSercopModulesEnabled(true);

        NonSercopModuleGuardInterceptor interceptor = new NonSercopModuleGuardInterceptor(props);
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/trade-financing"),
                response,
                handlerMethod(new TradeFinancingCommandController(), "endpoint")
        );

        assertThat(allowed).isTrue();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }

    @Test
    void allows_sercop_controller_in_default_mode() throws Exception {
        ModuleIsolationProperties props = new ModuleIsolationProperties();
        NonSercopModuleGuardInterceptor interceptor = new NonSercopModuleGuardInterceptor(props);

        MockHttpServletResponse response = new MockHttpServletResponse();
        boolean allowed = interceptor.preHandle(
                new MockHttpServletRequest("GET", "/api/compras-publicas/processes"),
                response,
                handlerMethod(new CPProcessController(), "endpoint")
        );

        assertThat(allowed).isTrue();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }

    // Dummy handlers para validar la lógica sin cargar el contexto completo.
    static class TradeFinancingCommandController {
        public void endpoint() {}
    }

    static class CPProcessController {
        public void endpoint() {}
    }
}
