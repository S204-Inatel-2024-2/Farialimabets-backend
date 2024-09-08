export interface IRouteDTO {
  route: string;
  methods: Array<'list' | 'show' | 'create' | 'update' | 'delete' | 'patch'>;
}
