import { GraphQLClient, gql } from "graphql-request";
import type { EnvironmentVariable } from "./type";

const endpoint = "https://api.zeabur.com/graphql";

interface ZeaburConfig {
  client: GraphQLClient;
  serviceId: string;
  envId: string;
}

/**
 * Create and configure a Zeabur GraphQL client
 * @returns Configured GraphQL client and environment variables
 */
function createZeaburClient(): ZeaburConfig {
  // Load environment variables from Bun.env (automatically loads from .env)
  const ZEABUR_API_KEY = Bun.env.ZEABUR_API_KEY;
  const ZEABUR_SERVICE_ID = Bun.env.ZEABUR_SERVICE_ID;
  const ZEABUR_ENV_ID = Bun.env.ZEABUR_ENV_ID;

  // Validate required environment variables
  if (!ZEABUR_API_KEY || !ZEABUR_SERVICE_ID || !ZEABUR_ENV_ID) {
    throw new Error(
      "Missing required environment variables: ZEABUR_API_KEY, ZEABUR_SERVICE_ID, ZEABUR_ENV_ID"
    );
  }

  // Create GraphQL client with authorization
  const client = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${ZEABUR_API_KEY}`,
    },
  });

  return {
    client,
    serviceId: ZEABUR_SERVICE_ID,
    envId: ZEABUR_ENV_ID,
  };
}

const getVariablesQuery = gql`
  query GetServiceVariables(
    $serviceId: ObjectID!
    $envId: ObjectID!
    $includeExposed: Boolean = false
  ) {
    service(_id: $serviceId) {
      _id
      name

      variables(environmentID: $envId, exposed: $includeExposed) {
        _id
        key
        value
        environmentID
        createdAt
        exposed
        readonly
        serviceID
      }
    }
  }
`;

const updateVariablesMutation = gql`
  mutation UpdateVariables(
    $serviceId: ObjectID!
    $envId: ObjectID!
    $data: Map!
  ) {
    updateEnvironmentVariable(
      environmentID: $envId
      serviceID: $serviceId
      data: $data
    )
  }
`;

const restartServiceMutation = gql`
  mutation RestartService($serviceId: ObjectID!, $envId: ObjectID!) {
    restartService(serviceID: $serviceId, environmentID: $envId)
  }
`;

export async function getZeaburVariables(): Promise<EnvironmentVariable[]> {
  const { client, serviceId, envId } = createZeaburClient();

  const data: any = await client.request(getVariablesQuery, {
    serviceId,
    envId,
  });

  // Return only the minimal fields (_id, key, value)
  return data.service.variables.map((variable: any) => ({
    _id: variable._id,
    key: variable.key,
    value: variable.value,
  }));
}

export async function updateZeaburVariables(variables: EnvironmentVariable[]) {
  const { client, serviceId, envId } = createZeaburClient();

  const data: Map<string, string> = new Map(variables.map((variable) => [variable.key, variable.value]));

  const result: any = await client.request(updateVariablesMutation, {
    serviceId,
    envId,
    data,
  });

  return result;
}

export async function restartZeaburService() {
  const { client, serviceId, envId } = createZeaburClient();

  const data: any = await client.request(restartServiceMutation, {
    serviceId,
    envId,
  });

  return data;
}
