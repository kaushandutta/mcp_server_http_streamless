import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import axios from "axios";
import { z } from 'zod';

export class MCPServer {
    static initialize(): McpServer {
        let server = new McpServer({
            name: "weather-mcp",
            version: "1.0.0"
        });

        console.log("Initializing MCP server with weather tool...");
        return MCPServer.setUpTools(server);
    }
    static setUpTools(server: McpServer): McpServer {
        // Register the tool - the SDK will automatically handle tools/list
        server.tool(
            "get-weather-data",
            "Get the weather data for a given city",
            {
                city: z.string().describe("The name of the city to get weather for")
            },
            async (params) => {
                console.log("🌤️  Weather tool called with parameters:", params);
                const { city } = params;

                try {
                    const weatherData = await MCPServer.cityWeather(city ?? 'kolkata');
                    console.log("✅ Weather data retrieved successfully for:", city);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Weather data for ${city}: ${JSON.stringify(weatherData, null, 2)}`
                            }
                        ],
                    };
                } catch (error) {
                    console.error("❌ Weather API error:", error);
                    return {
                        content: [
                            {
                                type: "text",
                                text: `Failed to get weather data for ${city}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                            }
                        ],
                    };
                }
            }
        );

        console.log("✅ Weather tool registered successfully");
        return server;
    }
    static async cityWeather(city: string): Promise<any> {
        try {
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=b5e1905f70ef4bf47b3235d50242e204&units=metric`
            );

            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return response.data;
        } catch (error) {
            console.error("Error fetching weather data:", error);
            if (axios.isAxiosError(error)) {
                throw new Error(`Weather API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
}

export default MCPServer;