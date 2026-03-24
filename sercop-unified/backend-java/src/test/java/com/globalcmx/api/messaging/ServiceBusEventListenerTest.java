package com.globalcmx.api.messaging;

import com.globalcmx.api.messaging.servicebus.ServiceBusEventListener;
import com.globalcmx.api.readmodel.projection.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pruebas unitarias para ServiceBusEventListener.
 *
 * Detecta:
 * - Topics sin processor (como el bug de institucion-financiera-events)
 * - Projections sin inyectar
 * - Métodos handler faltantes
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ServiceBusEventListener - Pruebas Unitarias")
class ServiceBusEventListenerTest {

    @Mock private MessagingProperties messagingProperties;
    @Mock private com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    @Mock private MonedaProjection monedaProjection;
    @Mock private CotizacionProjection cotizacionProjection;
    @Mock private ParticipanteProjection participanteProjection;
    @Mock private CuentaBancariaProjection cuentaBancariaProjection;
    @Mock private FinancialInstitutionProjection financialInstitutionProjection;

    private ServiceBusEventListener listener;

    /**
     * Topics que DEBEN tener un processor en ServiceBusEventListener.
     * Si se agrega un nuevo topic al sistema, debe agregarse aquí también.
     */
    private static final List<String> REQUIRED_TOPICS = List.of(
            "moneda-events",
            "cotizacion-events",
            "participante-events",
            "cuenta-bancaria-events",
            "institucion-financiera-events"
    );

    @BeforeEach
    void setUp() {
        listener = new ServiceBusEventListener(
                messagingProperties,
                objectMapper,
                monedaProjection,
                cotizacionProjection,
                participanteProjection,
                cuentaBancariaProjection,
                financialInstitutionProjection
        );
    }

    // ==================== CONSTRUCTOR ====================

    @Test
    @DisplayName("El constructor debe aceptar todas las projections requeridas")
    void constructor_shouldAcceptAllProjections() {
        assertThat(listener).isNotNull();
    }

    @Test
    @DisplayName("Debe inyectar FinancialInstitutionProjection")
    void constructor_shouldInjectFinancialInstitutionProjection() {
        // Verificar que el campo existe via reflection
        boolean hasField = Arrays.stream(ServiceBusEventListener.class.getDeclaredFields())
                .anyMatch(f -> f.getType() == FinancialInstitutionProjection.class);

        assertThat(hasField)
                .as("ServiceBusEventListener debe tener un campo FinancialInstitutionProjection")
                .isTrue();
    }

    // ==================== HANDLER METHODS ====================

    @Test
    @DisplayName("Debe tener un handler para cada topic requerido")
    void shouldHaveHandlerForEachRequiredTopic() {
        List<String> handlerMethods = Arrays.stream(ServiceBusEventListener.class.getDeclaredMethods())
                .filter(m -> m.getName().startsWith("handle"))
                .filter(m -> m.getParameterCount() == 1)
                .filter(m -> m.getParameterTypes()[0] == String.class)
                .map(Method::getName)
                .collect(Collectors.toList());

        // Debe haber al menos un handler por cada topic requerido
        assertThat(handlerMethods.size())
                .as("Debe haber al menos %d handlers para los topics: %s. Encontrados: %s",
                        REQUIRED_TOPICS.size(), REQUIRED_TOPICS, handlerMethods)
                .isGreaterThanOrEqualTo(REQUIRED_TOPICS.size());
    }

    @Test
    @DisplayName("Debe tener handler para eventos de instituciones financieras")
    void shouldHaveHandlerForFinancialInstitutionEvents() {
        boolean hasHandler = Arrays.stream(ServiceBusEventListener.class.getDeclaredMethods())
                .anyMatch(m -> m.getName().toLowerCase().contains("financialinstitution")
                        && m.getParameterCount() == 1
                        && m.getParameterTypes()[0] == String.class);

        assertThat(hasHandler)
                .as("Debe existir un método handler para Financial Institution events")
                .isTrue();
    }

    @Test
    @DisplayName("Debe tener handler para eventos de monedas")
    void shouldHaveHandlerForMonedaEvents() {
        assertHandlerExists("moneda");
    }

    @Test
    @DisplayName("Debe tener handler para eventos de cotizaciones")
    void shouldHaveHandlerForCotizacionEvents() {
        assertHandlerExists("cotizacion");
    }

    @Test
    @DisplayName("Debe tener handler para eventos de participantes")
    void shouldHaveHandlerForParticipantEvents() {
        assertHandlerExists("participant");
    }

    @Test
    @DisplayName("Debe tener handler para eventos de cuentas bancarias")
    void shouldHaveHandlerForCuentaBancariaEvents() {
        assertHandlerExists("cuentabancaria");
    }

    // ==================== PROJECTIONS REQUERIDAS ====================

    @Test
    @DisplayName("Todas las projections requeridas deben estar como campos del listener")
    void allRequiredProjections_shouldBeFieldsInListener() {
        List<Class<?>> requiredProjections = List.of(
                MonedaProjection.class,
                CotizacionProjection.class,
                ParticipanteProjection.class,
                CuentaBancariaProjection.class,
                FinancialInstitutionProjection.class
        );

        List<Class<?>> fieldTypes = Arrays.stream(ServiceBusEventListener.class.getDeclaredFields())
                .map(java.lang.reflect.Field::getType)
                .collect(Collectors.toList());

        for (Class<?> projection : requiredProjections) {
            assertThat(fieldTypes)
                    .as("ServiceBusEventListener debe tener un campo de tipo %s", projection.getSimpleName())
                    .contains(projection);
        }
    }

    // ==================== HELPERS ====================

    private void assertHandlerExists(String keyword) {
        boolean hasHandler = Arrays.stream(ServiceBusEventListener.class.getDeclaredMethods())
                .anyMatch(m -> m.getName().toLowerCase().contains(keyword)
                        && m.getParameterCount() == 1
                        && m.getParameterTypes()[0] == String.class);

        assertThat(hasHandler)
                .as("Debe existir un método handler que contenga '%s'", keyword)
                .isTrue();
    }
}
