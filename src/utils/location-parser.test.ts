import { describe, it, expect } from "bun:test";
import { parseLocation, formatLocation, type ParsedLocation } from "./location-parser";

describe("parseLocation", () => {
  describe("coordinate parsing", () => {
    it("should parse comma-separated coordinates", () => {
      const result = parseLocation("40.7128,-74.0060");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should parse space-separated coordinates", () => {
      const result = parseLocation("40.7128 -74.0060");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should parse explicit coordinate format with colons", () => {
      const result = parseLocation("lat:40.7128,lon:-74.0060");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should parse explicit coordinate format with spaces", () => {
      const result = parseLocation("lat 40.7128, lon -74.0060");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should parse case-insensitive explicit coordinates", () => {
      const result = parseLocation("LAT:40.7128,LON:-74.0060");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should parse integer coordinates", () => {
      const result = parseLocation("40,-74");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40,
        longitude: -74
      });
    });

    it("should parse coordinates with no decimal places", () => {
      const result = parseLocation("lat:0,lon:0");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 0,
        longitude: 0
      });
    });

    it("should handle coordinates at boundaries", () => {
      const northPole = parseLocation("90,0");
      expect(northPole.type).toBe("coordinates");
      expect(northPole.latitude).toBe(90);

      const southPole = parseLocation("-90,0");
      expect(southPole.type).toBe("coordinates");
      expect(southPole.latitude).toBe(-90);

      const dateLine = parseLocation("0,180");
      expect(dateLine.type).toBe("coordinates");
      expect(dateLine.longitude).toBe(180);

      const antiMeridian = parseLocation("0,-180");
      expect(antiMeridian.type).toBe("coordinates");
      expect(antiMeridian.longitude).toBe(-180);
    });
  });

  describe("invalid coordinates", () => {
    it("should treat invalid latitude as city name", () => {
      const result = parseLocation("91,0"); // latitude > 90
      expect(result).toEqual({
        type: "city",
        city: "91,0"
      });
    });

    it("should treat invalid longitude as city name", () => {
      const result = parseLocation("0,181"); // longitude > 180
      expect(result).toEqual({
        type: "city",
        city: "0,181"
      });
    });

    it("should treat negative invalid latitude as city name", () => {
      const result = parseLocation("-91,0"); // latitude < -90
      expect(result).toEqual({
        type: "city",
        city: "-91,0"
      });
    });

    it("should treat negative invalid longitude as city name", () => {
      const result = parseLocation("0,-181"); // longitude < -180
      expect(result).toEqual({
        type: "city",
        city: "0,-181"
      });
    });
  });

  describe("city name parsing", () => {
    it("should parse simple city name", () => {
      const result = parseLocation("New York");
      expect(result).toEqual({
        type: "city",
        city: "New York"
      });
    });

    it("should parse city with country code", () => {
      const result = parseLocation("New York, US");
      expect(result).toEqual({
        type: "city",
        city: "New York, US"
      });
    });

    it("should parse city with state and country", () => {
      const result = parseLocation("Los Angeles, CA, US");
      expect(result).toEqual({
        type: "city",
        city: "Los Angeles, CA, US"
      });
    });

    it("should parse international city", () => {
      const result = parseLocation("London, UK");
      expect(result).toEqual({
        type: "city",
        city: "London, UK"
      });
    });

    it("should handle single word city", () => {
      const result = parseLocation("Paris");
      expect(result).toEqual({
        type: "city",
        city: "Paris"
      });
    });
  });

  describe("whitespace handling", () => {
    it("should trim leading whitespace", () => {
      const result = parseLocation("  New York");
      expect(result).toEqual({
        type: "city",
        city: "New York"
      });
    });

    it("should trim trailing whitespace", () => {
      const result = parseLocation("New York  ");
      expect(result).toEqual({
        type: "city",
        city: "New York"
      });
    });

    it("should trim whitespace from coordinates", () => {
      const result = parseLocation("  40.7128,-74.0060  ");
      expect(result).toEqual({
        type: "coordinates",
        latitude: 40.7128,
        longitude: -74.0060
      });
    });

    it("should preserve internal spaces in city names", () => {
      const result = parseLocation("  New   York  ");
      expect(result).toEqual({
        type: "city",
        city: "New   York"
      });
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      const result = parseLocation("");
      expect(result).toEqual({
        type: "city",
        city: ""
      });
    });

    it("should handle only whitespace", () => {
      const result = parseLocation("   ");
      expect(result).toEqual({
        type: "city",
        city: ""
      });
    });

    it("should handle malformed coordinate strings", () => {
      const result = parseLocation("lat:40.7128,invalid");
      expect(result).toEqual({
        type: "city",
        city: "lat:40.7128,invalid"
      });
    });

    it("should handle partial coordinate format", () => {
      const result = parseLocation("lat:40.7128");
      expect(result).toEqual({
        type: "city",
        city: "lat:40.7128"
      });
    });

    it("should handle numbers that could be coordinates but aren't", () => {
      const result = parseLocation("12345"); // single number
      expect(result).toEqual({
        type: "city",
        city: "12345"
      });
    });
  });
});

describe("formatLocation", () => {
  it("should format coordinates with 4 decimal places", () => {
    const location: ParsedLocation = {
      type: "coordinates",
      latitude: 40.7128,
      longitude: -74.0060
    };
    const result = formatLocation(location);
    expect(result).toBe("40.7128, -74.0060");
  });

  it("should format coordinates with trailing zeros", () => {
    const location: ParsedLocation = {
      type: "coordinates",
      latitude: 40,
      longitude: -74
    };
    const result = formatLocation(location);
    expect(result).toBe("40.0000, -74.0000");
  });

  it("should format city names", () => {
    const location: ParsedLocation = {
      type: "city",
      city: "New York, US"
    };
    const result = formatLocation(location);
    expect(result).toBe("New York, US");
  });

  it("should handle missing city name", () => {
    const location: ParsedLocation = {
      type: "city"
    };
    const result = formatLocation(location);
    expect(result).toBe("Unknown location");
  });

  it("should handle missing coordinates", () => {
    const location: ParsedLocation = {
      type: "coordinates"
    };
    const result = formatLocation(location);
    expect(result).toBe("undefined, undefined");
  });

  it("should handle empty city name", () => {
    const location: ParsedLocation = {
      type: "city",
      city: ""
    };
    const result = formatLocation(location);
    expect(result).toBe("Unknown location");
  });
});