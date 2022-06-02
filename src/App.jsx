import styles from "./App.module.css";
import { Calculator, NewCalculator } from "@views";

function App() {
  return (
    <div className={styles.App}>
      {/* <Calculator /> */}
      <NewCalculator />
    </div>
  );
}

export default App;
