#!/bin/bash

echo "========================================"
echo "  APIs Consumidas en GlobalCMX"
echo "========================================"
echo ""

# Función para mostrar estadísticas
mostrar_estadisticas() {
    echo "📊 RESUMEN DE REQUESTS:"
    echo "----------------------------------------"

    # Total de requests
    total=$(docker logs kong-gateway 2>&1 | grep -E "GET|POST|PUT|DELETE|PATCH" | grep "/api/" | wc -l | tr -d ' ')
    echo "Total de requests: $total"
    echo ""

    # Requests por endpoint
    echo "🔗 TOP 10 ENDPOINTS MÁS CONSUMIDOS:"
    echo "----------------------------------------"
    docker logs kong-gateway 2>&1 | \
        grep -E "GET|POST|PUT|DELETE|PATCH" | \
        grep "/api/" | \
        awk '{print $7}' | \
        sort | uniq -c | sort -rn | head -10 | \
        awk '{printf "%3d requests → %s\n", $1, $2}'
    echo ""

    # Requests por código HTTP
    echo "📈 DISTRIBUCIÓN POR CÓDIGO HTTP:"
    echo "----------------------------------------"
    docker logs kong-gateway 2>&1 | \
        grep -E "GET|POST|PUT|DELETE|PATCH" | \
        grep "/api/" | \
        awk '{print $9}' | \
        sort | uniq -c | sort -rn | \
        awk '{
            code=$2
            count=$1
            if (code ~ /^2/) color="\033[0;32m" # Verde para 2xx
            else if (code ~ /^3/) color="\033[0;36m" # Cyan para 3xx
            else if (code ~ /^4/) color="\033[0;33m" # Amarillo para 4xx
            else if (code ~ /^5/) color="\033[0;31m" # Rojo para 5xx
            else color="\033[0m"
            reset="\033[0m"
            printf "%s%3d requests → HTTP %s%s\n", color, count, code, reset
        }'
    echo ""

    # Últimos requests
    echo "🕐 ÚLTIMOS 10 REQUESTS:"
    echo "----------------------------------------"
    docker logs kong-gateway 2>&1 | \
        grep -E "GET|POST|PUT|DELETE|PATCH" | \
        grep "/api/" | \
        tail -10 | \
        awk '{
            time=$4" "$5
            method=$6
            endpoint=$7
            code=$9
            gsub(/\[/, "", time)
            gsub(/\]/, "", time)
            gsub(/"/, "", method)

            if (code ~ /^2/) color="\033[0;32m"
            else if (code ~ /^4/) color="\033[0;33m"
            else if (code ~ /^5/) color="\033[0;31m"
            else color="\033[0m"
            reset="\033[0m"

            printf "%s %s%-6s%s %s%-40s%s %sHTTP %s%s\n",
                   time, "\033[1m", method, reset,
                   "\033[0;36m", endpoint, reset,
                   color, code, reset
        }'
    echo ""
}

# Función para modo live
modo_live() {
    echo "🔴 MODO LIVE - Mostrando requests en tiempo real"
    echo "   (Presiona Ctrl+C para detener)"
    echo "----------------------------------------"
    docker logs -f kong-gateway 2>&1 | \
        grep --line-buffered -E "GET|POST|PUT|DELETE|PATCH" | \
        grep --line-buffered "/api/" | \
        awk '{
            time=$4" "$5
            method=$6
            endpoint=$7
            code=$9
            gsub(/\[/, "", time)
            gsub(/\]/, "", time)
            gsub(/"/, "", method)

            if (code ~ /^2/) color="\033[0;32m"
            else if (code ~ /^4/) color="\033[0;33m"
            else if (code ~ /^5/) color="\033[0;31m"
            else color="\033[0m"
            reset="\033[0m"

            printf "%s %s%-6s%s %s%-40s%s %sHTTP %s%s\n",
                   time, "\033[1m", method, reset,
                   "\033[0;36m", endpoint, reset,
                   color, code, reset
            fflush()
        }'
}

# Función para buscar endpoint específico
buscar_endpoint() {
    local endpoint=$1
    echo "🔍 Buscando requests a: $endpoint"
    echo "----------------------------------------"
    docker logs kong-gateway 2>&1 | \
        grep -E "GET|POST|PUT|DELETE|PATCH" | \
        grep "$endpoint" | \
        awk '{
            time=$4" "$5
            method=$6
            endpoint=$7
            code=$9
            gsub(/\[/, "", time)
            gsub(/\]/, "", time)
            gsub(/"/, "", method)

            if (code ~ /^2/) color="\033[0;32m"
            else if (code ~ /^4/) color="\033[0;33m"
            else if (code ~ /^5/) color="\033[0;31m"
            else color="\033[0m"
            reset="\033[0m"

            printf "%s %s%-6s%s %s%-40s%s %sHTTP %s%s\n",
                   time, "\033[1m", method, reset,
                   "\033[0;36m", endpoint, reset,
                   color, code, reset
        }'
}

# Menú principal
case "${1:-stats}" in
    "stats"|"estadisticas")
        mostrar_estadisticas
        ;;
    "live"|"watch")
        modo_live
        ;;
    "search"|"buscar")
        if [ -z "$2" ]; then
            echo "❌ Error: Debes especificar un endpoint"
            echo "Uso: $0 search /api/monedas"
            exit 1
        fi
        buscar_endpoint "$2"
        ;;
    "help"|"ayuda"|"-h"|"--help")
        echo "Uso: $0 [comando] [opciones]"
        echo ""
        echo "Comandos disponibles:"
        echo "  stats, estadisticas    Mostrar estadísticas de APIs consumidas (por defecto)"
        echo "  live, watch            Monitorear requests en tiempo real"
        echo "  search, buscar [path]  Buscar requests a un endpoint específico"
        echo "  help, ayuda            Mostrar esta ayuda"
        echo ""
        echo "Ejemplos:"
        echo "  $0                              # Mostrar estadísticas"
        echo "  $0 stats                        # Mostrar estadísticas"
        echo "  $0 live                         # Modo live"
        echo "  $0 search /api/monedas         # Buscar requests a /api/monedas"
        ;;
    *)
        echo "❌ Comando no reconocido: $1"
        echo "Usa '$0 help' para ver los comandos disponibles"
        exit 1
        ;;
esac
