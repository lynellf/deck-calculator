import { useState, useEffect } from "react";
import { range } from "@math";

const grabHeaders = (handSize) => [...range(handSize), "Total", "Remove"];

/**
 * @description Defines Table Headers based on hand size
 * @param {number} handSize total number of cards drawn
 * @returns {string[]} table headers
 */
export default function useTableHeaders(handSize = 5) {
  const [headers, setHeaders] = useState([]);

  useEffect(() => {
    const headers = grabHeaders(handSize);
    setHeaders(headers);
  }, [handSize]);

  return headers;
}
