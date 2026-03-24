package com.globalcmx.api.service.plantilla;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * Servicio para convertir números a palabras en español e inglés
 */
@Service
public class NumberToWordsService {

    private static final String[] UNITS_ES = {"", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"};
    private static final String[] TENS_ES = {"", "diez", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"};
    private static final String[] TEENS_ES = {"diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"};
    private static final String[] HUNDREDS_ES = {"", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"};

    private static final String[] UNITS_EN = {"", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"};
    private static final String[] TENS_EN = {"", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"};
    private static final String[] TEENS_EN = {"ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"};

    private static final Map<String, String[]> CURRENCY_NAMES = new HashMap<>();

    static {
        CURRENCY_NAMES.put("USD_ES", new String[]{"dólar estadounidense", "dólares estadounidenses", "centavo", "centavos"});
        CURRENCY_NAMES.put("USD_EN", new String[]{"US dollar", "US dollars", "cent", "cents"});
        CURRENCY_NAMES.put("EUR_ES", new String[]{"euro", "euros", "céntimo", "céntimos"});
        CURRENCY_NAMES.put("EUR_EN", new String[]{"euro", "euros", "cent", "cents"});
        CURRENCY_NAMES.put("MXN_ES", new String[]{"peso mexicano", "pesos mexicanos", "centavo", "centavos"});
        CURRENCY_NAMES.put("MXN_EN", new String[]{"Mexican peso", "Mexican pesos", "centavo", "centavos"});
        CURRENCY_NAMES.put("GTQ_ES", new String[]{"quetzal", "quetzales", "centavo", "centavos"});
        CURRENCY_NAMES.put("GTQ_EN", new String[]{"quetzal", "quetzals", "centavo", "centavos"});
        CURRENCY_NAMES.put("HNL_ES", new String[]{"lempira", "lempiras", "centavo", "centavos"});
        CURRENCY_NAMES.put("HNL_EN", new String[]{"lempira", "lempiras", "centavo", "centavos"});
        CURRENCY_NAMES.put("NIO_ES", new String[]{"córdoba", "córdobas", "centavo", "centavos"});
        CURRENCY_NAMES.put("NIO_EN", new String[]{"córdoba", "córdobas", "centavo", "centavos"});
        CURRENCY_NAMES.put("CRC_ES", new String[]{"colón", "colones", "céntimo", "céntimos"});
        CURRENCY_NAMES.put("CRC_EN", new String[]{"colón", "colones", "centimo", "centimos"});
        CURRENCY_NAMES.put("PAB_ES", new String[]{"balboa", "balboas", "centésimo", "centésimos"});
        CURRENCY_NAMES.put("PAB_EN", new String[]{"balboa", "balboas", "centesimo", "centesimos"});
        CURRENCY_NAMES.put("DOP_ES", new String[]{"peso dominicano", "pesos dominicanos", "centavo", "centavos"});
        CURRENCY_NAMES.put("DOP_EN", new String[]{"Dominican peso", "Dominican pesos", "centavo", "centavos"});
        CURRENCY_NAMES.put("GBP_ES", new String[]{"libra esterlina", "libras esterlinas", "penique", "peniques"});
        CURRENCY_NAMES.put("GBP_EN", new String[]{"pound sterling", "pounds sterling", "penny", "pence"});
        CURRENCY_NAMES.put("JPY_ES", new String[]{"yen", "yenes", "", ""});
        CURRENCY_NAMES.put("JPY_EN", new String[]{"yen", "yen", "", ""});
        CURRENCY_NAMES.put("CHF_ES", new String[]{"franco suizo", "francos suizos", "céntimo", "céntimos"});
        CURRENCY_NAMES.put("CHF_EN", new String[]{"Swiss franc", "Swiss francs", "centime", "centimes"});
    }

    /**
     * Convierte un monto a palabras en español
     */
    public String convertToSpanish(BigDecimal amount, String currencyCode) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            return "";
        }

        long integerPart = amount.setScale(0, RoundingMode.FLOOR).longValue();
        int decimalPart = amount.remainder(BigDecimal.ONE).multiply(new BigDecimal(100)).intValue();

        StringBuilder result = new StringBuilder();

        if (integerPart == 0) {
            result.append("cero");
        } else {
            result.append(convertLongToSpanish(integerPart));
        }

        // Agregar nombre de moneda
        String[] currencyNames = CURRENCY_NAMES.getOrDefault(currencyCode + "_ES",
            new String[]{currencyCode, currencyCode, "centavo", "centavos"});

        result.append(" ").append(integerPart == 1 ? currencyNames[0] : currencyNames[1]);

        // Agregar centavos si hay
        if (decimalPart > 0 && currencyNames[2] != null && !currencyNames[2].isEmpty()) {
            result.append(" con ").append(convertLongToSpanish(decimalPart));
            result.append(" ").append(decimalPart == 1 ? currencyNames[2] : currencyNames[3]);
        }

        return capitalizeFirst(result.toString());
    }

    /**
     * Convierte un monto a palabras en inglés
     */
    public String convertToEnglish(BigDecimal amount, String currencyCode) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            return "";
        }

        long integerPart = amount.setScale(0, RoundingMode.FLOOR).longValue();
        int decimalPart = amount.remainder(BigDecimal.ONE).multiply(new BigDecimal(100)).intValue();

        StringBuilder result = new StringBuilder();

        if (integerPart == 0) {
            result.append("zero");
        } else {
            result.append(convertLongToEnglish(integerPart));
        }

        // Agregar nombre de moneda
        String[] currencyNames = CURRENCY_NAMES.getOrDefault(currencyCode + "_EN",
            new String[]{currencyCode, currencyCode, "cent", "cents"});

        result.append(" ").append(integerPart == 1 ? currencyNames[0] : currencyNames[1]);

        // Agregar centavos si hay
        if (decimalPart > 0 && currencyNames[2] != null && !currencyNames[2].isEmpty()) {
            result.append(" and ").append(convertLongToEnglish(decimalPart));
            result.append(" ").append(decimalPart == 1 ? currencyNames[2] : currencyNames[3]);
        }

        return capitalizeFirst(result.toString());
    }

    /**
     * Convierte un monto con el formato simple: "MONTO (MONTO EN LETRAS)"
     */
    public String formatAmountWithWords(BigDecimal amount, String currencyCode, String language) {
        String formatted = String.format("%s %,.2f", currencyCode, amount);
        String words = "ES".equalsIgnoreCase(language) ?
            convertToSpanish(amount, currencyCode) :
            convertToEnglish(amount, currencyCode);
        return formatted + " (" + words + ")";
    }

    private String convertLongToSpanish(long number) {
        if (number == 0) return "cero";
        if (number < 0) return "menos " + convertLongToSpanish(-number);

        StringBuilder result = new StringBuilder();

        // Billones (10^12)
        if (number >= 1_000_000_000_000L) {
            long trillions = number / 1_000_000_000_000L;
            result.append(trillions == 1 ? "un billón" : convertLongToSpanish(trillions) + " billones");
            number %= 1_000_000_000_000L;
            if (number > 0) result.append(" ");
        }

        // Miles de millones (10^9)
        if (number >= 1_000_000_000) {
            long billions = number / 1_000_000_000;
            result.append(convertLongToSpanish(billions)).append(" mil");
            number %= 1_000_000_000;
            if (number >= 1_000_000) result.append(" ");
        }

        // Millones
        if (number >= 1_000_000) {
            long millions = number / 1_000_000;
            result.append(millions == 1 ? "un millón" : convertLongToSpanish(millions) + " millones");
            number %= 1_000_000;
            if (number > 0) result.append(" ");
        }

        // Miles
        if (number >= 1000) {
            long thousands = number / 1000;
            if (thousands == 1) {
                result.append("mil");
            } else {
                result.append(convertHundredsToSpanish((int) thousands)).append(" mil");
            }
            number %= 1000;
            if (number > 0) result.append(" ");
        }

        // Cientos
        if (number > 0) {
            result.append(convertHundredsToSpanish((int) number));
        }

        return result.toString().trim();
    }

    private String convertHundredsToSpanish(int number) {
        if (number == 0) return "";
        if (number == 100) return "cien";

        StringBuilder result = new StringBuilder();

        // Centenas
        if (number >= 100) {
            result.append(HUNDREDS_ES[number / 100]);
            number %= 100;
            if (number > 0) result.append(" ");
        }

        // Decenas y unidades
        if (number >= 10 && number <= 19) {
            result.append(TEENS_ES[number - 10]);
        } else if (number >= 20 && number < 30) {
            if (number == 20) {
                result.append("veinte");
            } else {
                result.append("veinti").append(UNITS_ES[number % 10]);
            }
        } else if (number >= 30) {
            result.append(TENS_ES[number / 10]);
            if (number % 10 > 0) {
                result.append(" y ").append(UNITS_ES[number % 10]);
            }
        } else if (number > 0) {
            result.append(UNITS_ES[number]);
        }

        return result.toString();
    }

    private String convertLongToEnglish(long number) {
        if (number == 0) return "zero";
        if (number < 0) return "negative " + convertLongToEnglish(-number);

        StringBuilder result = new StringBuilder();

        // Trillions
        if (number >= 1_000_000_000_000L) {
            long trillions = number / 1_000_000_000_000L;
            result.append(convertLongToEnglish(trillions)).append(" trillion");
            number %= 1_000_000_000_000L;
            if (number > 0) result.append(" ");
        }

        // Billions
        if (number >= 1_000_000_000) {
            long billions = number / 1_000_000_000;
            result.append(convertLongToEnglish(billions)).append(" billion");
            number %= 1_000_000_000;
            if (number > 0) result.append(" ");
        }

        // Millions
        if (number >= 1_000_000) {
            long millions = number / 1_000_000;
            result.append(convertLongToEnglish(millions)).append(" million");
            number %= 1_000_000;
            if (number > 0) result.append(" ");
        }

        // Thousands
        if (number >= 1000) {
            long thousands = number / 1000;
            result.append(convertLongToEnglish(thousands)).append(" thousand");
            number %= 1000;
            if (number > 0) result.append(" ");
        }

        // Hundreds
        if (number >= 100) {
            result.append(UNITS_EN[(int) number / 100]).append(" hundred");
            number %= 100;
            if (number > 0) result.append(" ");
        }

        // Tens and units
        if (number >= 10 && number <= 19) {
            result.append(TEENS_EN[(int) number - 10]);
        } else if (number >= 20) {
            result.append(TENS_EN[(int) number / 10]);
            if (number % 10 > 0) {
                result.append("-").append(UNITS_EN[(int) number % 10]);
            }
        } else if (number > 0) {
            result.append(UNITS_EN[(int) number]);
        }

        return result.toString();
    }

    private String capitalizeFirst(String text) {
        if (text == null || text.isEmpty()) return text;
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }
}
