"use strict";

// Punto de entrada para Passenger (cPanel)
// Next.js standalone genera su propio server.js en .next/standalone/
// Este archivo lo delega directamente.

const path = require("path");

// Cambia el directorio de trabajo al standalone para que los
// paths relativos internos de Next.js funcionen correctamente.
process.chdir(path.join(__dirname, ".next", "standalone"));
require(path.join(__dirname, ".next", "standalone", "server.js"));
