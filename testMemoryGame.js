const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

let passed = 0;
let failed = 0;

async function runTests() {
  let options = new chrome.Options();
  options.addArguments("--headless", "--no-sandbox", "--disable-dev-shm-usage");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("http://18.212.65.223:8081/");

    // ✅ Test 1: Check main heading
    await runTest("Test 1: Heading includes 'difficulty'", async () => {
      const heading = await driver.findElement(By.css("div")).getText();
      if (!heading.toLowerCase().includes("difficulty"))
        throw new Error("Main heading not found");
    });

    // ✅ Test 2: Difficulty buttons exist
    await runTest("Test 2: Difficulty buttons visible", async () => {
      await driver.findElement(By.xpath("//button[contains(text(),'Easy')]"));
      await driver.findElement(By.xpath("//button[contains(text(),'Medium')]"));
      await driver.findElement(By.xpath("//button[contains(text(),'Hard')]"));
    });

    // ✅ Test 3: Hard mode - 10 cards
    await runTest("Test 3: Hard mode shows 10 cards", async () => {
      await driver
        .findElement(By.xpath("//button[contains(text(),'Hard')]"))
        .click();
      await driver.sleep(1000);
      const cards = await driver.findElements(By.css(".poke-list > li"));
      if (cards.length !== 10)
        throw new Error(
          "Expected 10 cards in Hard mode, found " + cards.length
        );
    });

    // ✅ Test 4: Medium mode - 7 cards
    await runTest("Test 4: Medium mode shows 7 cards", async () => {
      await driver.navigate().refresh();
      await driver.sleep(500);
      await driver
        .findElement(By.xpath("//button[contains(text(),'Medium')]"))
        .click();
      await driver.sleep(1000);
      const cards = await driver.findElements(By.className("poke-card"));
      if (cards.length !== 7)
        throw new Error(
          "Expected 7 cards in Medium mode, found " + cards.length
        );
    });

    // ✅ Test 5: Easy mode - 4 cards
    await runTest("Test 5: Easy mode shows 4 cards", async () => {
      await driver.navigate().refresh();
      await driver.sleep(500);
      await driver
        .findElement(By.xpath("//button[contains(text(),'Easy')]"))
        .click();
      await driver.sleep(1000);
      const cards = await driver.findElements(By.className("poke-card"));
      if (cards.length !== 4)
        throw new Error("Expected 4 cards in Easy mode, found " + cards.length);
    });

    // ✅ Test 6: Cards show name and image
    await runTest("Test 6: Cards show name and image", async () => {
      const cards = await driver.findElements(By.className("poke-card"));
      for (let i = 0; i < cards.length; i++) {
        const img = await cards[i].findElement(By.css("img"));
        const src = await img.getAttribute("src");
        const alt = await img.getAttribute("alt");
        if (!src || !alt)
          throw new Error(`Card ${i + 1} missing image or text`);
      }
    });

    // ✅ Test 7: Score text visible
    await runTest("Test 7: Score text appears", async () => {
      const scoreText = await driver
        .findElement(By.css(".gamebox-header > p"))
        .getAttribute("innerHTML");
      if (!scoreText.includes("/"))
        throw new Error("Score format is incorrect or missing");
    });

    // ✅ Test 8: Score updates after click
    await runTest("Test 8: Score updates after card click", async () => {
      const scoreBefore = await driver
        .findElement(By.css(".gamebox-header > p"))
        .getAttribute("innerHTML");
      const cards = await driver.findElements(By.className("poke-card"));
      await cards[0].click();
      await driver.sleep(1000);
      const scoreAfter = await driver
        .findElement(By.css(".gamebox-header > p"))
        .getAttribute("innerHTML");
      if (scoreBefore === scoreAfter)
        throw new Error("Score did not change after card click");
    });

    // ✅ Test 9: Game title is displayed
    await runTest("Test 9: Game title is visible", async () => {
      const title = await driver
        .findElement(By.css(".gamebox-header > h1 > span"))
        .getAttribute("innerHTML");
      if (!title || title.trim() === "")
        throw new Error("Game title not found");
    });

    // ✅ Test 10: Game over modal appears
    await runTest(
      "Test 10: Game over modal appears after clicking all cards",
      async () => {
        await driver.navigate().refresh();
        await driver.sleep(500);
        await driver
          .findElement(By.xpath("//button[contains(text(),'Easy')]"))
          .click();
        await driver.sleep(1000);
        const cards = await driver.findElements(By.className("poke-card"));

        let gameOverDetected = false;
        for (let i = 0; i < cards.length; i++) {
          await driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            cards[i]
          );
          await cards[i].click();
          await driver.sleep(800);
          try {
            const gif = await driver.findElement(
              By.css("img[alt='gameover gif']")
            );
            if (await gif.isDisplayed()) {
              gameOverDetected = true;
              break;
            }
          } catch (e) {
            // Continue loop
          }
        }

        if (!gameOverDetected)
          throw new Error("Game over modal did not appear");
      }
    );
  } finally {
    await driver.quit();
    console.log(`\n🧪 Test Summary: ✅ ${passed} passed, ❌ ${failed} failed`);
  }
}

// ✅ Helper
async function runTest(label, fn) {
  try {
    await fn();
    passed++;
    console.log(`✅ ${label}`);
  } catch (err) {
    failed++;
    console.error(`❌ ${label}: ${err.message}`);
  }
}

runTests();
