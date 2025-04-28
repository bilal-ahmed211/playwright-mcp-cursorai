import { uiTest as test } from '../../../../fixtures';
import { TeamPage, HomePage } from '../../../pages';

test.describe.skip('FYI.ai Team Page Tests', () => {
  let teamPage: TeamPage;
  let homePage: HomePage;
  
  test.beforeEach(async ({ page }) => {
    // Initialize page objects with self-healing
    teamPage = new TeamPage(page, true);
    homePage = new HomePage(page, true);
  });

  test.skip('Team page - Verify team members and content', async ({ page }) => {
    try {
      // Perform Team page smoke test
      await teamPage.smokeTest();
    } catch (error) {
      console.error(`Error in Team page content test: ${error}`);
      throw error;
    }
  });
  
  test.skip('Team page - Navigation from homepage', async ({ page }) => {
    try {
      // Navigate to homepage first
      await homePage.navigateToHomePage();
      
      // Click on Team link in navigation
      await teamPage.navigateToTeamPage();
      
      // Verify navigation to Team page
      await teamPage.verifyTitle('The Team - FYI');
      await teamPage.verifyUrl('team');
      await teamPage.verifyMainContent();
      await teamPage.verifyTeamMembers();
    } catch (error) {
      console.error(`Error in Team navigation test: ${error}`);
      throw error;
    }
  });
}); 