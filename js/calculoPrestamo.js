document.addEventListener("DOMContentLoaded", function () {
    const loanForm = document.getElementById("loan-form");
    const resultsSection = document.getElementById("results");
    const calcularBtn = document.getElementById("calcular-btn");

    calcularBtn.addEventListener("click", async function () {
        const monto = parseFloat(document.getElementById('amount').value);
        const cantidadCuotas = parseFloat(document.getElementById('term').value);
        const ingresosMensuales = parseFloat(document.getElementById('income').value);
        
        if (!monto || !cantidadCuotas || !ingresosMensuales) {
            Toastify({
                text: "Por favor, complete todos los campos antes de calcular.",
                backgroundColor: "red",
                position: "bottom-right",
            }).showToast();
            return;
        }

        try {
            const tna = await obtenerTasaNominalAnual(monto, cantidadCuotas);
            const cuotaMensual = calcularCuotas(monto, cantidadCuotas, tna);

            const monthlyPaymentSpan = document.querySelector('#monthly-payment span');
            const totalPaymentSpan = document.querySelector('#total-payment span');
            const totalInterestSpan = document.querySelector('#total-interest span');
            const tnaSpan = document.querySelector('#tna span');

            const maxCuotaPermitida = ingresosMensuales * 0.3;

            if (cuotaMensual <= maxCuotaPermitida) {
                
                Toastify({
                    text: "¡Préstamo aprobado!",
                    backgroundColor: "green",
                    position: "bottom-right",
                }).showToast();
            } else {

                Toastify({
                    text: "Préstamo no aprobado. Cuota mensual excede el 30% de los ingresos.",
                    backgroundColor: "red",
                    position: "bottom-right",
                }).showToast();
                return; 
            }

            monthlyPaymentSpan.textContent = cuotaMensual;
            totalPaymentSpan.textContent = (cuotaMensual * cantidadCuotas).toFixed(2);
            totalInterestSpan.textContent = ((cuotaMensual * cantidadCuotas) - monto).toFixed(2);

            
            tnaSpan.textContent = tna;

            const loanData = {
                monto,
                cantidadCuotas,
                tna,
                totalPaymentSpan,
            };
            localStorage.setItem("loanData", JSON.stringify(loanData));

            resultsSection.style.display = "block";
        } catch (error) {

            console.error('Error al obtener la TNA:', error);
        }
    });
});

function obtenerTasaNominalAnual(monto, cuotas) {
    const apiUrl = 'https://www.bancoprovincia.com.ar/Master/Calculate'; 


    const requestData = {
        lista: [
            { nombre: "idTipo", tipo: "idTipo", valor: "57" },
            { nombre: "monto", tipo: "monto", valor: monto.toString() },
            { nombre: "plazo", tipo: "plazo", valor: cuotas.toString() }
        ]
    };

    return fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Accept': '*/*',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Content-Type': 'application/json;charset=UTF-8',

        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(data => {

            const tna = data._salida.TNA;
            const tnaNumber = parseFloat(tna.replace(',', '.').replace('%', '')); 
            return tnaNumber;
        })
        .catch(error => {
            console.error('Error al obtener la TNA:', error);
            throw error; 
        });
}

function calcularCuotas(monto, cuotas, tna) {
    const tasaMensual = tna / 12 / 100;
    const cuotaFija = (monto * tasaMensual) / (1 - Math.pow(1 + tasaMensual, -cuotas));
    return cuotaFija.toFixed(2);
}