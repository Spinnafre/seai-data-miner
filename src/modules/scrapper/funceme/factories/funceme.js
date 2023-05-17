import { FuncemeDataMiner } from "../../infra/scrapper/ftp/dataMiner.js";

import { MetereologicalEquipmentDao } from "../../infra/database/postgreSQL/entities/Equipment.js";

import { StationReadDao } from "../../infra/database/postgreSQL/entities/station.js";
import { FuncemeLog } from "../../infra/database/postgreSQL/entities/FuncemeLog.js";
import { PluviometerReadDao } from "../../infra/database/postgreSQL/entities/pluviometer.js";

import { ExtractPluviometersFromFunceme } from "../services/pluviometerDataMiner.js";
import { ExtractStationsFromFunceme } from "../services/stationDataMiner.js";
import { FTPClientAdapter } from "../../infra/scrapper/ftp/connection/ftp.js";
export class FuncemeFactory {
  constructor() {
    this.#ftpClient = null;
  }

  buildConnection() {
    this.#ftpClient = FTPClientAdapter.create();
    return this.#ftpClient;
  }

  buildLogs() {
    return new FuncemeLog();
  }

  buildServices() {
    const funcemeDataMiner = new FuncemeDataMiner(this.#ftpClient);

    const metereologicalEquipment = new MetereologicalEquipmentDao();

    const stationDao = new StationReadDao();
    const pluviometerDao = new PluviometerReadDao();

    const pluviometerDataMiner = new ExtractPluviometersFromFunceme(
      funcemeDataMiner,
      metereologicalEquipment,
      pluviometerDao
    );

    const stationDataMiner = new ExtractStationsFromFunceme(
      funcemeDataMiner,
      metereologicalEquipment,
      stationDao
    );

    return {
      stationService: stationDataMiner,
      pluviometerService: pluviometerDataMiner,
    };
  }
}
