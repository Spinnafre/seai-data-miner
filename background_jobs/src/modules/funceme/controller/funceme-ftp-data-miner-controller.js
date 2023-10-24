import { Left, Right } from "../../../shared/result.js";
import { ConnectionError } from "../core/errors/ConnectionError.js";

export class FuncemeFtpDataMinerController {
  #dataMinerServices = [];
  static timeout = 50000;

  constructor(ftpClient, logger, dataMinerServices = [], getFtpCredentials) {
    this.logger = logger;
    this.ftpClient = ftpClient;
    this.#dataMinerServices.concat(dataMinerServices);
    this.getFtpCredentials = getFtpCredentials;
  }

  async runServices(dto) {
    const logs = [];

    for (const service of this.#dataMinerServices) {
      await service.execute(dto);

      logs.concat(service.getLogs());
    }

    await this.logger.add(logs);
  }

  // TO-DO: check if is necessary to add unref in the runServices promise
  async runWithTimeout(dto) {
    await Promise.race([
      this.runServices(dto),
      timeout(FuncemeDataMinerController.timeout),
    ]);
  }

  async handle(request) {
    const dto = new FuncemeScrapperWorkerDTO(request);

    try {
      const credentialsOrError = await this.getFtpCredentials.execute(
        "FUNCEME"
      );

      if (credentialsOrError.isError()) {
        return Left.create(credentialsOrError.error().message);
      }

      const { host, user, password } = credentialsOrError.value();

      await this.ftpClient.connect({ host, user, password });

      await this.runWithTimeout(dto);

      await this.ftpClient.close();

      return Right.create();
    } catch (error) {
      Logger.error({
        msg: "Falha ao executar worker da funceme.",
        obj: error,
      });

      if (error instanceof ConnectionError === false) {
        await this.ftpClient.close();
      }

      await this.logger.addError(error.message);

      //Essencial para o PG-BOSS entender que ocorreu um erro
      return Left.create(error);
    }
  }
}
