const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function runTests() {
  let options = new chrome.Options();
  options.addArguments("--headless", "--no-sandbox", "--disable-dev-shm-usage");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    await driver.get("http://18.212.65.223:8081/");

    // ✅ Test 1: Check main heading (e.g., "Select Difficulty Level")
    const heading = await driver.findElement(By.css("div")).getText();
    if (!heading.toLowerCase().includes("difficulty"))
      throw new Error("Main heading not found");
    console.log("✅ Test 1 Passed: Difficulty heading visible");

    // ✅ Test 2: Difficulty buttons exist
    await driver.findElement(By.xpath("//button[contains(text(),'Easy')]"));
    await driver.findElement(By.xpath("//button[contains(text(),'Medium')]"));
    await driver.findElement(By.xpath("//button[contains(text(),'Hard')]"));
    console.log("✅ Test 2 Passed: All difficulty buttons found");

    // ✅ Test 3: Hard mode - 10 cards
    await driver
      .findElement(By.xpath("//button[contains(text(),'Hard')]"))
      .click();
    await driver.sleep(1000);
    let hardCards = await driver.findElements(By.css(".poke-list > li"));
    if (hardCards.length !== 10)
      throw new Error("Hard mode should show 10 cards");
    console.log("✅ Test 3 Passed: Hard mode shows 10 cards");

    // ✅ Test 4: Medium mode - 7 cards
    await driver.navigate().refresh();
    await driver.sleep(500);
    await driver
      .findElement(By.xpath("//button[contains(text(),'Medium')]"))
      .click();
    await driver.sleep(1000);
    let mediumCards = await driver.findElements(By.className("poke-card"));
    if (mediumCards.length !== 7)
      throw new Error("Medium mode should show 7 cards");
    console.log("✅ Test 4 Passed: Medium mode shows 7 cards");

    // ✅ Test 5: Easy mode - 4 cards
    await driver.navigate().refresh();
    await driver.sleep(500);
    await driver
      .findElement(By.xpath("//button[contains(text(),'Easy')]"))
      .click();
    await driver.sleep(1000);
    let easyCards = await driver.findElements(By.className("poke-card"));
    if (easyCards.length !== 4)
      throw new Error("Easy mode should show 4 cards");
    console.log("✅ Test 5 Passed: Easy mode shows 4 cards");

    // ✅ Test 6: Cards show name and image
    for (let i = 0; i < easyCards.length; i++) {
      let img = await easyCards[i].findElement(By.css("img"));
      let src = await img.getAttribute("src");
      let alt = await img.getAttribute("alt");
      if (!src || !alt) {
        throw new Error(`Card ${i + 1} missing image or text`);
      }
    }
    console.log("✅ Test 6 Passed: All cards show image and text");

    // // ✅ Test 7: Score text appears inside .gamebox-header > p
    let scoreElement = await driver.findElement(By.css(".gamebox-header > p"));
    let scoreText = await scoreElement.getAttribute("innerHTML");
    console.log("SCORE", scoreText);
    if (!scoreText.includes("/")) {
      throw new Error("Score format is incorrect or not visible");
    }
    console.log(
      "✅ Test 7 Passed: Score text is visible and correctly formatted:",
      scoreText
    );

    // ✅ Test 8: Score changes after clicking unique card
    let scoreBefore = scoreText;
    await easyCards[0].click(); // click any one card
    await driver.sleep(1000);
    let updatedScore = await driver
      .findElement(By.css(".gamebox-header > p"))
      .getAttribute("innerHTML");
    if (scoreBefore === updatedScore) {
      throw new Error("Score did not change after clicking a card");
    }
    console.log(
      `✅ Test 8 Passed: Score updated from ${scoreBefore} to ${updatedScore}`
    );

    // ✅ Test 9: Game title is displayed in .gamebox-header > h1
    let titleElement = await driver.findElement(
      By.css(".gamebox-header > h1 > span")
    );
    let titleText = await titleElement.getAttribute("innerHTML");
    if (!titleText || titleText.trim() === "") {
      throw new Error("Game title is not displayed");
    }

    console.log(`✅ Test 9 Passed: Game title is displayed!`);

    // ✅ Test 10: Game over modal appears after clicking all cards
    await driver.navigate().refresh();
    await driver.sleep(500);
    await driver
      .findElement(By.xpath("//button[contains(text(),'Easy')]"))
      .click();
    await driver.sleep(1000);

    // Get all cards
    let cards = await driver.findElements(By.className("poke-card"));

    let gameOverDetected = false;

    for (let i = 0; i < cards.length; i++) {
      // Scroll + click card
      await driver.executeScript(
        "arguments[0].scrollIntoView(true);",
        cards[i]
      );
      await cards[i].click();
      await driver.sleep(800); // short wait to allow UI update

      // Try detecting the modal after click
      try {
        let gameOverGif = await driver.findElement(
          By.css("img[alt='gameover gif']")
        );
        if (await gameOverGif.isDisplayed()) {
          gameOverDetected = true;
          console.log("Game over modal detected after clicking card:", i + 1);
          break;
        }
      } catch (e) {
        // Modal not visible yet – continue loop
      }
    }
    if (!gameOverDetected) {
      throw new Error("Game over modal never appeared — test failed.");
    }
    console.log(
      "✅ Test 10 Passed: Game over modal appears after clicking all cards"
    );

    console.log("😸 All tests passed! 🎉");
  } catch (err) {
    console.error("❌ Test Failed:", err.message);
  } finally {
    await driver.quit();
  }
}

runTests();
