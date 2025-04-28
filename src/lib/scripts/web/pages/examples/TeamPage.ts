import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Locators } from '../../../../../data/web/locators/fyi-locators';
import { SelfHealingLocators } from '../../../../../data/web/locators/self-healing-locators';

/**
 * TeamPage provides functionality to interact with the Team page
 * Using the unified BasePage that combines self-healing capabilities
 */
export class TeamPage extends BasePage {
  constructor(page: Page, useSelfHealing: boolean = false) {
    super(page, useSelfHealing);
  }

  /**
   * Navigate to the Team page
   */
  async navigateToTeamPage() {
    await this.navigate('team');
  }

  /**
   * Verify main content on the Team page
   */
  async verifyMainContent() {
    const locator = this.useSelfHealing ? 
      SelfHealingLocators.team.mainHeading : 
      Locators.team.mainHeading;
    
    // Use safe verification method that handles strict mode violations
    await this.safeVerifyVisible(locator);
  }

  /**
   * Verify team members and their roles
   */
  async verifyTeamMembers() {
    // Team members
    const teamMembers = [
      this.useSelfHealing ? SelfHealingLocators.team.teamMembers.willIAm : Locators.team.teamMembers.willIAm,
      this.useSelfHealing ? SelfHealingLocators.team.teamMembers.sunilReddy : Locators.team.teamMembers.sunilReddy,
      this.useSelfHealing ? SelfHealingLocators.team.teamMembers.leeChan : Locators.team.teamMembers.leeChan
    ];
    
    // Roles
    const roles = [
      this.useSelfHealing ? SelfHealingLocators.team.roles.founderCEO : Locators.team.roles.founderCEO,
      this.useSelfHealing ? SelfHealingLocators.team.roles.coFounderCTO : Locators.team.roles.coFounderCTO,
      this.useSelfHealing ? SelfHealingLocators.team.roles.cooMHC : Locators.team.roles.cooMHC
    ];
    
    // Verify all team members
    for (const memberLocator of teamMembers) {
      await this.safeVerifyVisible(memberLocator);
    }
    
    // Verify all roles
    for (const roleLocator of roles) {
      await this.safeVerifyVisible(roleLocator);
    }
  }

  /**
   * Click on a team member profile
   * @param memberName Name of the team member
   */
  async clickTeamMember(memberName: string) {
    let locator;
    
    // Determine which locator to use based on member name
    switch (memberName.toLowerCase()) {
      case 'will.i.am':
        locator = this.useSelfHealing ? 
          SelfHealingLocators.team.teamMembers.willIAm : 
          Locators.team.teamMembers.willIAm;
        break;
      case 'sunil reddy':
        locator = this.useSelfHealing ? 
          SelfHealingLocators.team.teamMembers.sunilReddy : 
          Locators.team.teamMembers.sunilReddy;
        break;
      case 'lee chan':
        locator = this.useSelfHealing ? 
          SelfHealingLocators.team.teamMembers.leeChan : 
          Locators.team.teamMembers.leeChan;
        break;
      default:
        throw new Error(`Unknown team member: ${memberName}`);
    }
    
    // Use safe action method that handles strict mode violations
    await this.safeElementAction(locator, 'click');
  }

  /**
   * Perform a complete smoke test of the Team page
   */
  async smokeTest() {
    await this.navigateToTeamPage();
    await this.verifyTitle('The Team - FYI');
    await this.verifyUrl('team');
    // await this.verifyMainContent();
    // await this.verifyTeamMembers();
    // await this.verifyNavigationLinks();
    await this.verifyFooter();
    
    // Test navigation
    await this.clickNavLink('Home');
  }
} 