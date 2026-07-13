export class CloudProviderSyncOutputDto {
  provider!: string;
  activities_imported!: number;
  activities_skipped?: number;
  activities_reconciled?: number;
  last_success_at!: string;
}
