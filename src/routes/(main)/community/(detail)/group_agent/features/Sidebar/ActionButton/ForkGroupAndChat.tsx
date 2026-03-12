'use client';

import { Button } from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles } from 'antd-style';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import urlJoin from 'url-join';

import { useWorkspaceAwareNavigate } from '@/features/Workspace/useWorkspaceAwareNavigate';
import { usePermission } from '@/hooks/usePermission';
import { chatGroupService } from '@/services/chatGroup';
import { useAgentGroupStore } from '@/store/agentGroup';

import { useDetailContext } from '../../DetailProvider';

const styles = createStaticStyles(({ css }) => ({
  buttonGroup: css`
    width: 100%;
  `,
}));

const ForkGroupAndChat = memo<{ mobile?: boolean }>(() => {
  const {
    avatar,
    backgroundColor,
    description,
    tags,
    title,
    config,
    identifier,
    memberAgents = [],
  } = useDetailContext();
  const [isLoading, setIsLoading] = useState(false);
  const { message } = App.useApp();
  const { t } = useTranslation('discover');
  const navigate = useWorkspaceAwareNavigate();
  const loadGroups = useAgentGroupStore((s) => s.loadGroups);
  const { allowed: canCreate } = usePermission('create_content');

  const meta = {
    avatar,
    backgroundColor,
    description,
    tags,
    title,
  };

  const handleForkAndChat = async () => {
    if (!canCreate) return;

    try {
      setIsLoading(true);

      const existingGroupId = await chatGroupService.getGroupByForkedFromIdentifier(identifier!);

      if (existingGroupId) {
        message.info(t('fork.alreadyForked'));
        navigate(urlJoin('/group', existingGroupId));
        return;
      }

      if (!config) {
        message.error(
          t('groupAgents.noConfig', { defaultValue: 'Group configuration not available' }),
        );
        return;
      }

      // Find supervisor from memberAgents
      const supervisorMember = memberAgents.find((member: any) => {
        const agent = member.agent || member;
        const role = member.role || agent.role;
        return role === 'supervisor';
      });

      let supervisorConfig;
      if (supervisorMember) {
        const member = supervisorMember as any;
        const agent = member.agent || member;
        const currentVersion = member.currentVersion || member;
        const rawConfig = {
          avatar: currentVersion.avatar,
          backgroundColor: currentVersion.backgroundColor,
          chatConfig: currentVersion.config?.chatConfig || currentVersion.chatConfig,
          description: currentVersion.description,
          model: currentVersion.config?.model || currentVersion.model,
          params: currentVersion.config?.params || currentVersion.params,
          plugins: currentVersion.config?.plugins || currentVersion.plugins,
          provider: currentVersion.config?.provider || currentVersion.provider,
          systemRole:
            currentVersion.config?.systemRole ||
            currentVersion.config?.systemPrompt ||
            currentVersion.systemRole ||
            currentVersion.content,
          tags: currentVersion.tags,
          title: currentVersion.name || agent.name || 'Supervisor',
        };
        supervisorConfig = Object.fromEntries(
          Object.entries(rawConfig).filter(([_, v]) => v != null),
        );
      }

      const members = memberAgents
        .filter((member: any) => {
          const agent = member.agent || member;
          const role = member.role || agent.role;
          return role !== 'supervisor';
        })
        .map((member: any) => {
          const agent = member.agent || member;
          const currentVersion = member.currentVersion || member;
          return {
            avatar: currentVersion.avatar,
            backgroundColor: currentVersion.backgroundColor,
            chatConfig: currentVersion.config?.chatConfig || currentVersion.chatConfig,
            description: currentVersion.description,
            model: currentVersion.config?.model || currentVersion.model,
            plugins: currentVersion.config?.plugins || currentVersion.plugins,
            provider: currentVersion.config?.provider || currentVersion.provider,
            systemRole:
              currentVersion.config?.systemRole ||
              currentVersion.config?.systemPrompt ||
              currentVersion.systemRole ||
              currentVersion.content,
            tags: currentVersion.tags,
            title: currentVersion.name || agent.name,
          };
        });

      const groupConfig = {
        config: {
          ...config,
          forkedFromIdentifier: identifier,
        },
        content: config.systemRole || supervisorConfig?.systemRole,
        ...meta,
        marketIdentifier: identifier,
      };
      const result = await chatGroupService.createGroupWithMembers(
        groupConfig,
        members,
        supervisorConfig,
      );
      await loadGroups();

      message.success(t('fork.success'));
      navigate(urlJoin('/group', result.groupId));
    } catch (error: any) {
      console.error('Fork group failed:', error);
      message.error(t('fork.failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      block
      className={styles.buttonGroup}
      disabled={!canCreate}
      loading={isLoading}
      size={'large'}
      type={'primary'}
      onClick={handleForkAndChat}
    >
      {t('fork.forkAndChat')}
    </Button>
  );
});

export default ForkGroupAndChat;
